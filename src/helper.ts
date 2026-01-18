import type { Cheerio, CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

export function getParsedDataFromHtml(parsedHtml: CheerioAPI) {
   return {
    analysis: parsedHtml('#analysis'),
    peers: parsedHtml('#peers'),
    quarters: parsedHtml('#quarters'),
    profitLoss: parsedHtml('#profit-loss'),
    balanceSheet: parsedHtml('#balance-sheet'),
    cashFlow: parsedHtml('#cash-flow'),
    ratios: parsedHtml('#ratios'),
    shareholding: parsedHtml('#shareholding'),
    documents: parsedHtml('#documents')
   }
}

export function processAnalysis(analysis: Cheerio<Element>) {
    const pros = analysis
        .find('.pros ul li')
        .map((_, el) => el.firstChild && 'data' in el.firstChild ? el.firstChild.data?.trim() : '')
        .toArray()
        .filter((text): text is string => !!text);

    const cons = analysis
        .find('.cons ul li')
        .map((_, el) => el.firstChild && 'data' in el.firstChild ? el.firstChild.data?.trim() : '')
        .toArray()
        .filter((text): text is string => !!text);

    return { pros, cons };
}