import * as cheerio from "cheerio";
import { fetchPage } from "./adapter.js";
import { getParsedDataFromHtml, processAnalysis } from "./helper.js";

export async function ScreenerScraperPro(screenerUrl: string){
    try{
        const html = await fetchPage(screenerUrl);
        const cheerioObj = cheerio.load(html);
        const parsedHtml = cheerioObj;

        const parsedDataFromHtml = getParsedDataFromHtml(parsedHtml);

        let analysis = {};
        if(parsedDataFromHtml.analysis.length > 0){
            analysis = processAnalysis(parsedDataFromHtml.analysis);
        }
        
        return {
            analysis,
        }
    }catch(error){
        console.error(error); 
    }
}

console.log(await ScreenerScraperPro("https://www.screener.in/company/522195/"))
