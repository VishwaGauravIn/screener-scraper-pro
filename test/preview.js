import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { ScreenerScraperPro } from '../dist/index.js';

// Preview script changes:
// - accepts one or more company tickers via CLI arguments or COMPANY env var
// - downloads each transcript PDF named <COMPANY>.pdf
// - saves the PDFs in test/Q4FY26
// - if no company is provided, uses the latest PDF in test/Q4FY26
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultDir = path.join(__dirname, 'Q4FY26');
let currentPdfPath = '';
let currentCompany = '';

async function promptForCompanies() {
  const rl = readline.createInterface({ input, output });
  console.log('Enter company tickers, one per line. Submit an empty line to finish.');

  const companies = [];
  while (true) {
    const line = await rl.question('> ');
    const company = line.trim().toUpperCase();
    if (!company) break;
    companies.push(company);
  }

  rl.close();
  return companies;
}

function resolveCompanies() {
  const companies = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith('--'))
    .map(arg => arg.trim().toUpperCase())
    .filter(Boolean);

  if (companies.length) {
    return companies;
  }

  const envCompany = process.env.COMPANY ? process.env.COMPANY.trim().toUpperCase() : '';
  return envCompany ? [envCompany] : [];
}

async function ensureResultDir() {
  await fs.mkdir(resultDir, { recursive: true });
}

function sanitizeCompany(company) {
  return String(company || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

async function findLatestPdf() {
  await ensureResultDir();
  const entries = await fs.readdir(resultDir, { withFileTypes: true });
  const pdfFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
    .map((entry) => entry.name);

  if (!pdfFiles.length) {
    return null;
  }

  let latestFile = null;
  let latestMtime = 0;

  for (const file of pdfFiles) {
    const filePath = path.join(resultDir, file);
    const stat = await fs.stat(filePath);
    if (stat.mtimeMs > latestMtime) {
      latestMtime = stat.mtimeMs;
      latestFile = filePath;
    }
  }

  return latestFile;
}

async function downloadTranscriptForCompany(company) {
  if (!company) {
    throw new Error('A company ticker is required. Use: node test/preview.js SAILIFE');
  }

  const screenerUrl = `https://www.screener.in/company/${encodeURIComponent(company)}/`;
  console.log('Fetching data for', company, 'from', screenerUrl);
  const result = await ScreenerScraperPro(screenerUrl);
  const transcriptUrl = result?.documents?.concalls?.[0]?.transcript;

  if (!transcriptUrl) {
    throw new Error(`No transcript found for ${company}. Make sure the company exists on screener.in.`);
  }

  const response = await fetch(transcriptUrl);
  if (!response.ok) {
    throw new Error(`Failed to download transcript: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const pdfName = `${company}.pdf`;
  const outPath = path.join(resultDir, pdfName);
  await ensureResultDir();
  await fs.writeFile(outPath, Buffer.from(buffer));

  currentPdfPath = outPath;
  currentCompany = company;

  console.log('Saved transcript to', outPath);
  return { company, outPath };
}

async function ensurePreviewTarget() {
  let companies = resolveCompanies();

  if (!companies.length) {
    companies = await promptForCompanies();
  }

  if (companies.length) {
    const successes = [];
    const failures = [];
    let lastResult = null;

    for (const company of companies) {
      try {
        lastResult = await downloadTranscriptForCompany(company);
        successes.push(company);
      } catch (error) {
        console.error(`Failed to download ${company}:`, error.message);
        failures.push(company);
      }
    }

    console.log('\nDownload summary:');
    if (successes.length) {
      console.log('  succeeded:', successes.join(', '));
    }
    if (failures.length) {
      console.log('  failed:   ', failures.join(', '));
    }

    if (lastResult) {
      return lastResult;
    }

    throw new Error('No PDF was successfully downloaded. Check the failed companies and try again.');
  }

  const latestPdf = await findLatestPdf();
  if (latestPdf) {
    currentPdfPath = latestPdf;
    currentCompany = path.basename(latestPdf, '.pdf');

    console.log('Using latest PDF in test/Q4FY26:', currentCompany);
    return { company: currentCompany, outPath: currentPdfPath };
  }

  throw new Error('No company provided and no existing PDF preview. Use: node test/preview.js HCLTECH');
}

function renderHomePage() {
  const heading = currentCompany ? `Transcript Preview: ${currentCompany}` : 'Transcript Preview';
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>${heading}</title>
    <style>html,body{height:100%;margin:0}iframe{width:100%;height:100%;border:0}body{font-family:system-ui,sans-serif}</style>
  </head>
  <body>
    <iframe src="/transcript.pdf"></iframe>
  </body>
</html>`;
}

async function main() {
  try {
    await ensurePreviewTarget();

    const server = http.createServer(async (req, res) => {
      try {
        if (req.url === '/transcript.pdf') {
          const stat = await fs.stat(currentPdfPath);
          const data = await fs.readFile(currentPdfPath);
          res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': String(stat.size),
          });
          res.end(data);
          return;
        }

        const html = renderHomePage();
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(String(err));
      }
    });

    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const url = `http://localhost:${port}/`;
      console.log('Preview available at', url);
      console.log('Showing company:', currentCompany || 'none');

      const platform = process.platform;
      const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
      exec(`${cmd} "${url}"`, (err) => {
        if (err) console.log('Could not open browser automatically:', err.message);
      });
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
