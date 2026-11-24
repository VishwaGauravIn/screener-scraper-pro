import * as cheerio from "cheerio";
import { fetchPage } from "./adapter.js";
import { getParsedDataFromHtml, processAbsoluteTable, processAnalysis, processCompanyInfo, processDocuments, processPnlToFindCAGRs, processShareholding, processTopRatios } from "./helper.js";

// No try/catch here on purpose. Earlier errors were caught and it returned undefined,
// so the caller never knew what went wrong. Now errors (wrong symbol, no internet etc.)
// are thrown, and the caller can handle them.
export async function ScreenerScraperPro(screenerUrl: string){
    const html = await fetchPage(screenerUrl);
    const cheerioObj = cheerio.load(html);
    const parsedHtml = cheerioObj;

    const parsedDataFromHtml = getParsedDataFromHtml(parsedHtml);

    // If none of the usual sections are there, it's not a company page,
    // so throw instead of returning a bunch of empty objects
    if (parsedHtml('#top-ratios').length === 0 && parsedDataFromHtml.profitLoss.length === 0) {
        throw new Error(`The page at ${screenerUrl} does not look like a screener.in company page`);
    }

    const { name, about, basis } = processCompanyInfo(parsedHtml);
    const topRatios = processTopRatios(parsedHtml);

    let analysis = {};
    let quarters = {};
    let profitLoss = {};
    let balanceSheet = {};
    let cashFlow = {};
    let ratios = {};
    let shareholding = {};
    let documents = {};
    let CAGRs = {}

    if(parsedDataFromHtml.analysis.length > 0){
        analysis = processAnalysis(parsedDataFromHtml.analysis);
    }

    if(parsedDataFromHtml.quarters.length > 0){
        quarters = processAbsoluteTable(parsedDataFromHtml.quarters);
    }

    if(parsedDataFromHtml.profitLoss.length > 0){
        profitLoss = processAbsoluteTable(parsedDataFromHtml.profitLoss);
    }

    if(parsedDataFromHtml.balanceSheet.length > 0){
        balanceSheet = processAbsoluteTable(parsedDataFromHtml.balanceSheet);
    }

    if(parsedDataFromHtml.cashFlow.length > 0){
        cashFlow = processAbsoluteTable(parsedDataFromHtml.cashFlow);
    }

    if(parsedDataFromHtml.ratios.length > 0){
        ratios = processAbsoluteTable(parsedDataFromHtml.ratios);
    }

    if(parsedDataFromHtml.shareholding.length > 0){
        shareholding = processShareholding(parsedDataFromHtml.shareholding);
    }

    if(parsedDataFromHtml.documents.length > 0){
        documents = processDocuments(parsedDataFromHtml.documents);
    }

    if(parsedDataFromHtml.profitLoss.length > 0){
        CAGRs = processPnlToFindCAGRs(parsedDataFromHtml.profitLoss);
    }

    return {
        name,
        about,
        basis,
        topRatios,
        analysis,
        quarters,
        profitLoss,
        balanceSheet,
        cashFlow,
        ratios,
        shareholding,
        documents,
        CAGRs
    }
}
