import { ScreenerScraperPro } from "../dist/index.js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sampleURL = "https://www.screener.in/company/SAILIFE/";

async function selfInvokeTEST() {
    const result = await ScreenerScraperPro(sampleURL);
    console.log(result);
    console.log(result.documents.concalls[0]);
    
    // Write result to JSON file
    const outputPath = join(__dirname, "result.json");
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\nResult saved to: ${outputPath}`);
}

selfInvokeTEST();