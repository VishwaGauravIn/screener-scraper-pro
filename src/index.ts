import * as cheerio from "cheerio";
import { fetchPage } from "./adapter.js";
import { getParsedDataFromHtml, processAbsoluteTable, processAnalysis, processDocuments, processPnlToFindCAGRs } from "./helper.js";

export async function ScreenerScraperPro(screenerUrl: string){
    try{
        const html = await fetchPage(screenerUrl);
        const cheerioObj = cheerio.load(html);
        const parsedHtml = cheerioObj;

        const parsedDataFromHtml = getParsedDataFromHtml(parsedHtml);

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
            shareholding = processAbsoluteTable(parsedDataFromHtml.shareholding);
        }

        if(parsedDataFromHtml.documents.length > 0){
            documents = processDocuments(parsedDataFromHtml.documents);
        }

        if(parsedDataFromHtml.profitLoss.length > 0){
            CAGRs = processPnlToFindCAGRs(parsedDataFromHtml.profitLoss);
        }
        
        return {
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
    }catch(error){
        console.error(error); 
    }
}
