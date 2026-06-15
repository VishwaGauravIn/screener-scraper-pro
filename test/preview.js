import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { ScreenerScraperPro } from '../dist/index.js';

// Preview script changes:
// - accepts a company ticker via CLI argument or COMPANY env var
// - prompts for a ticker if none is supplied
// - downloads a transcript PDF named transcript-<COMPANY>.pdf
// - saves the latest request metadata in test/result.json
// - reuses the last requested company for preview when no new ticker is provided
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultFile = path.join(__dirname, 'result.json');
let currentPdfPath = path.join(__dirname, 'transcript.pdf');
let currentCompany = '';

function sanitizeCompany(company) {
  return String(company || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function resolveCompanyArg() {
  const arg = process.argv[2] || process.env.COMPANY;
  return sanitizeCompany(arg);
}

async function loadLastResult() {
  try {
    const raw = await fs.readFile(resultFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveResult(result) {
  await fs.writeFile(resultFile, JSON.stringify(result, null, 2));
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
  const pdfName = `transcript-${company}.pdf`;
  const outPath = path.join(__dirname, pdfName);
  await fs.writeFile(outPath, Buffer.from(buffer));

  currentPdfPath = outPath;
  currentCompany = company;

  await saveResult({
    company,
    screenerUrl,
    transcriptUrl,
    pdfPath: outPath,
    fetchedAt: new Date().toISOString(),
  });

  console.log('Saved transcript to', outPath);
  return { company, outPath };
}

async function promptForCompany() {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question('Enter company ticker for preview: ');
  rl.close();
  return sanitizeCompany(answer);
}

async function ensurePreviewTarget() {
  let companyArg = resolveCompanyArg();
  if (!companyArg) {
    console.log('No company provided via CLI or COMPANY env var. Prompting for one now.');
    companyArg = await promptForCompany();
  }

  if (companyArg) {
    return downloadTranscriptForCompany(companyArg);
  }

  const lastResult = await loadLastResult();
  if (lastResult?.company && lastResult?.pdfPath) {
    currentCompany = lastResult.company;
    currentPdfPath = lastResult.pdfPath;

    const exists = await fs.stat(currentPdfPath).then(() => true).catch(() => false);
    if (!exists) {
      throw new Error(`Latest company PDF not found at ${currentPdfPath}. Provide a company ticker to regenerate.`);
    }

    console.log('Using latest company from result.json:', currentCompany);
    return { company: currentCompany, outPath: currentPdfPath };
  }

  throw new Error('No company provided and no previous preview available. Use: node test/preview.js SAILIFE');
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
