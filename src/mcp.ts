#!/usr/bin/env node
// MCP server for screener-scraper-pro.
//
// An MCP client (Claude Desktop, Claude Code, Cursor, ...) starts this file as a child
// process and talks to it in JSON over stdin/stdout. Because stdout carries the protocol,
// this file must never use console.log — use console.error for any logging.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ScreenerScraperPro } from "./index.js";

const BASE_URL = "https://www.screener.in";
const CACHE_TTL_MS = 10 * 60 * 1000;

type Report = Awaited<ReturnType<typeof ScreenerScraperPro>>;

// ---------------------------------------------------------------------------
// Fetching with a small in-memory cache.
// The AI often calls several tools for the same company in a row; the cache turns
// that into a single request to screener.in. The promise is cached (not the result)
// so two parallel calls for the same page also share one request.
// ---------------------------------------------------------------------------
const cache = new Map<string, { expires: number; report: Promise<Report> }>();

function fetchReport(url: string): Promise<Report> {
    const hit = cache.get(url);
    if (hit && hit.expires > Date.now()) return hit.report;

    const report = ScreenerScraperPro(url);
    cache.set(url, { expires: Date.now() + CACHE_TTL_MS, report });
    report.catch(() => cache.delete(url)); // don't cache failures
    return report;
}

function normalizeSymbol(input: string): string {
    // Accept "tcs", "TCS" or a full URL like https://www.screener.in/company/TCS/consolidated/
    const fromUrl = input.match(/\/company\/([^/]+)/i);
    const symbol = (fromUrl?.[1] ?? input).trim().toUpperCase();
    if (!symbol) throw new Error("Symbol is empty");
    return symbol;
}

// Fetch a company. Defaults to consolidated figures (what screener.in shows by default
// for companies with subsidiaries). If a company has no consolidated figures, falls back
// to standalone. The returned `basis` always says which one the numbers are.
async function getCompany(
    symbolInput: string,
    standalone: boolean | undefined
): Promise<{ symbol: string; url: string; report: Report; note?: string }> {
    const symbol = normalizeSymbol(symbolInput);
    const standaloneUrl = `${BASE_URL}/company/${encodeURIComponent(symbol)}/`;
    const consolidatedUrl = `${standaloneUrl}consolidated/`;

    if (standalone) {
        return { symbol, url: standaloneUrl, report: await fetchReport(standaloneUrl) };
    }

    const report = await fetchReport(consolidatedUrl);
    if (report.basis === "consolidated" && isFresh(report)) {
        return { symbol, url: consolidatedUrl, report };
    }
    // No (current) consolidated figures, e.g. the company has no subsidiaries, or its
    // consolidated data stopped years ago. Use standalone instead.
    return {
        symbol,
        url: standaloneUrl,
        report: await fetchReport(standaloneUrl),
        note: "No current consolidated figures on screener.in for this company; showing standalone.",
    };
}

// Some companies stopped reporting consolidated results years ago (e.g. VSTIND's end in
// 2010). Treat consolidated data as current only if its latest quarter ("Sep 2026") is
// less than ~10 months old.
function isFresh(report: Report): boolean {
    const headers = (report.quarters as { headers?: string[] }).headers ?? [];
    const latest = Math.max(0, ...headers.map((h) => Date.parse(`1 ${h.replace(/\(S\)/, "").trim()}`) || 0));
    return Date.now() - latest < 300 * 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Helpers for building tool results
// ---------------------------------------------------------------------------
function ok(data: unknown) {
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function fail(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const hint = /HTTP 404/.test(message)
        ? " The symbol was not found. Use the search_company tool to find the correct screener symbol."
        : "";
    return { isError: true, content: [{ type: "text" as const, text: message + hint }] };
}

// Wraps a tool handler so any thrown error becomes a readable tool error for the AI.
function safe<A>(handler: (args: A) => Promise<unknown>) {
    return async (args: A) => {
        try {
            return ok(await handler(args));
        } catch (error) {
            console.error(error);
            return fail(error);
        }
    };
}

// ---------------------------------------------------------------------------
// Tool input schemas (zod). The SDK turns these into JSON Schema so the AI knows
// what arguments to send, and validates the arguments before our code runs.
// ---------------------------------------------------------------------------
const symbolArg = z
    .string()
    .describe('Screener.in company symbol, e.g. "TCS", "RELIANCE", "HDFCBANK". Use search_company if unsure.');
const standaloneArg = z
    .boolean()
    .optional()
    .describe("Default false: consolidated figures (parent + subsidiaries). Set true for the parent company only.");

const readOnly = { readOnlyHint: true, openWorldHint: true } as const;

const server = new McpServer({ name: "screener-scraper-pro", version: "1.0.0" });

// 1. Search -----------------------------------------------------------------
server.registerTool(
    "search_company",
    {
        title: "Search company",
        description:
            "Search screener.in for Indian listed companies (NSE/BSE) by name and get their screener symbols. " +
            "Use this first when you only know the company name.",
        inputSchema: { query: z.string().min(1).describe('Company name, e.g. "tata motors"') },
        annotations: readOnly,
    },
    safe(async ({ query }: { query: string }) => {
        const url = `${BASE_URL}/api/company/search/?q=${encodeURIComponent(query)}&v=3&fts=1`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`screener.in search returned HTTP ${response.status}`);
        const results = (await response.json()) as { id: number | null; name: string; url: string }[];
        return results
            .filter((r) => r.id !== null && r.url.startsWith("/company/"))
            .map((r) => ({ name: r.name, symbol: normalizeSymbol(r.url) }));
    })
);

// 2. Overview ---------------------------------------------------------------
server.registerTool(
    "get_company_overview",
    {
        title: "Company overview",
        description:
            "Key facts for a company: name, about, current price, market cap, P/E, book value, dividend yield, " +
            "ROCE, ROE, 52-week high/low, screener's pros and cons, and compounded growth rates " +
            "(sales, profit, stock price CAGR, ROE over 10/5/3 years and TTM). Start here for most questions.",
        inputSchema: { symbol: symbolArg, standalone: standaloneArg },
        annotations: readOnly,
    },
    safe(async ({ symbol, standalone }: { symbol: string; standalone?: boolean | undefined }) => {
        const { url, report, note } = await getCompany(symbol, standalone);
        return {
            name: report.name,
            symbol: normalizeSymbol(symbol),
            basis: report.basis,
            ...(note && { note }),
            source: url,
            about: report.about,
            topRatios: report.topRatios,
            analysis: report.analysis,
            CAGRs: report.CAGRs,
        };
    })
);

// 3. Financial tables -------------------------------------------------------
const sectionDescriptions = {
    quarters: "quarterly results: Sales, Expenses, Operating Profit, OPM %, Net Profit, EPS",
    profitLoss: "annual profit & loss incl. TTM and Dividend Payout %",
    balanceSheet: "annual balance sheet: Equity, Reserves, Borrowings, Fixed Assets, Investments, Total Assets",
    cashFlow: "annual cash flow: operating/investing/financing cash, Free Cash Flow, CFO/EBITDA",
    ratios: "annual efficiency ratios: Debtor Days, Inventory Days, Cash Conversion Cycle, ROCE %",
} as const;

server.registerTool(
    "get_financials",
    {
        title: "Financial statement",
        description:
            "One financial table for a company, values in Rs. Crores. Sections: " +
            Object.entries(sectionDescriptions).map(([k, v]) => `${k} (${v})`).join("; ") + ".",
        inputSchema: {
            symbol: symbolArg,
            section: z.enum(["quarters", "profitLoss", "balanceSheet", "cashFlow", "ratios"]),
            standalone: standaloneArg,
        },
        annotations: readOnly,
    },
    safe(async ({ symbol, section, standalone }: { symbol: string; section: keyof typeof sectionDescriptions; standalone?: boolean | undefined }) => {
        const { url, report, note } = await getCompany(symbol, standalone);
        const table = report[section] as { headers?: string[] };
        const hasStandaloneColumns = table.headers?.some((h) => h.includes("(S)"));
        return {
            name: report.name,
            section,
            basis: report.basis,
            ...(note && { note }),
            ...(hasStandaloneColumns && {
                "(S)": "Columns marked (S) are standalone figures, shown where consolidated figures are not available.",
            }),
            unit: "Rs. Crores (except %, days and EPS)",
            source: url,
            ...table,
        };
    })
);

// 4. Shareholding -----------------------------------------------------------
server.registerTool(
    "get_shareholding",
    {
        title: "Shareholding pattern",
        description:
            "Shareholding pattern over time: Promoters, FIIs (foreign institutional investors), DIIs (domestic institutions), " +
            "Government, Public (in %), and number of shareholders. Quarterly covers the last ~3 years; yearly goes back further.",
        inputSchema: {
            symbol: symbolArg,
            period: z.enum(["quarterly", "yearly", "both"]).optional().describe('Default "quarterly"'),
        },
        annotations: readOnly,
    },
    safe(async ({ symbol, period }: { symbol: string; period?: "quarterly" | "yearly" | "both" | undefined }) => {
        // Shareholding is the same on the standalone and consolidated pages.
        const { url, report } = await getCompany(symbol, undefined);
        const shareholding = report.shareholding as { quarterly?: unknown; yearly?: unknown };
        const p = period ?? "quarterly";
        return {
            name: report.name,
            source: url,
            ...(p !== "yearly" && { quarterly: shareholding.quarterly }),
            ...(p !== "quarterly" && { yearly: shareholding.yearly }),
        };
    })
);

// 5. Documents --------------------------------------------------------------
server.registerTool(
    "get_documents",
    {
        title: "Company documents",
        description:
            "Links to a company's documents: recent announcements, annual reports, credit ratings, and " +
            "earnings call (concall) transcripts / presentations / recordings. Newest first.",
        inputSchema: {
            symbol: symbolArg,
            type: z.enum(["announcements", "annualReports", "creditRatings", "concalls", "all"]).optional().describe('Default "all"'),
            limit: z.number().int().min(1).max(100).optional().describe("Max items per document type. Default 10."),
        },
        annotations: readOnly,
    },
    safe(async ({ symbol, type, limit }: { symbol: string; type?: string | undefined; limit?: number | undefined }) => {
        const { url, report } = await getCompany(symbol, undefined);
        const documents = report.documents as Record<string, unknown[]>;
        const max = limit ?? 10;
        const picked: Record<string, unknown[]> = {};
        for (const [key, items] of Object.entries(documents)) {
            if (!type || type === "all" || type === key) picked[key] = items.slice(0, max);
        }
        return { name: report.name, source: url, ...picked };
    })
);

// 6. Everything -------------------------------------------------------------
server.registerTool(
    "get_full_report",
    {
        title: "Full report",
        description:
            "Everything screener.in has for a company in one response (large: ~10k tokens). " +
            "Prefer the more specific tools unless you really need all sections.",
        inputSchema: { symbol: symbolArg, standalone: standaloneArg },
        annotations: readOnly,
    },
    safe(async ({ symbol, standalone }: { symbol: string; standalone?: boolean | undefined }) => {
        const { url, report, note } = await getCompany(symbol, standalone);
        return { source: url, ...(note && { note }), ...report };
    })
);

// ---------------------------------------------------------------------------
// Start: connect to the client over stdin/stdout
// ---------------------------------------------------------------------------
await server.connect(new StdioServerTransport());
console.error("screener-scraper-pro MCP server running on stdio");
