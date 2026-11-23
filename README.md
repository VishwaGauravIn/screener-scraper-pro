<div align="center">
 <h1> <img src="https://github.com/user-attachments/assets/cca40ba1-af34-4384-af1d-392f976328ea" width="80px"><br/>Screener Scraper Pro</h1>
 <a href="https://itsvg.in" target="_blank"><img src="https://img.shields.io/badge/Creator-Vishwa%20Gaurav-blue"/></a> 
 <img src="https://img.shields.io/npm/v/screener-scraper-pro?label=%20"/>
 <img src="https://img.shields.io/npm/dt/screener-scraper-pro">
 <img src="https://img.shields.io/snyk/vulnerabilities/github/VishwaGauravIn/screener-scraper-pro"/>
 <img src="https://img.shields.io/badge/License-GPL%20v3-brightgreen"/>
 <img src="https://img.shields.io/github/languages/code-size/VishwaGauravIn/screener-scraper-pro?logo=github">
</div>

&nbsp;
<p align="center"> Effortlessly scrape comprehensive financial data from <a href="https://www.screener.in" target="_blank">screener.in</a> and use it in your projects. <b>No API key required.</b> </p>
&nbsp;

## ✨ Features

- **Complete Financial Data** - Extract quarterly results, annual profit & loss, balance sheet, cash flow, and ratios
- **Growth Metrics** - Get compounded sales growth, profit growth, stock price CAGR, and ROE
- **Shareholding Patterns** - Track promoter, FII, DII, and public holdings over time
- **Company Documents** - Access announcements, annual reports, credit ratings, and concall transcripts
- **Analysis Insights** - Automatically extract pros and cons from screener's analysis
- **TypeScript Support** - Full type definitions included
- **Zero Dependencies on External APIs** - Directly scrapes public data from screener.in

## 📦 Installation

```bash
# npm
npm install screener-scraper-pro

# yarn
yarn add screener-scraper-pro

# pnpm
pnpm add screener-scraper-pro
```

## 🚀 Quick Start

```javascript
import { ScreenerScraperPro } from "screener-scraper-pro";

// Use any screener.in company URL
const data = await ScreenerScraperPro("https://www.screener.in/company/RELIANCE/");

console.log(data.analysis);      // { pros: [...], cons: [...] }
console.log(data.CAGRs);         // Growth rates over different periods
console.log(data.quarters);      // Quarterly financial results
console.log(data.profitLoss);    // Annual P&L statements
console.log(data.balanceSheet);  // Balance sheet data
```

## 📊 Data Structure

The `ScreenerScraperPro` function returns an object with the following sections:

| Property | Description |
|----------|-------------|
| `name` | Company name |
| `about` | Company description from screener |
| `basis` | `"consolidated"` or `"standalone"`: which figures the tables contain |
| `topRatios` | Market Cap, Current Price, High / Low, Stock P/E, Book Value, Dividend Yield, ROCE, ROE, Face Value |
| `analysis` | Pros and cons extracted from screener's analysis |
| `quarters` | Quarterly results (Sales, Expenses, Profit, EPS, etc.) |
| `profitLoss` | Annual profit & loss statements |
| `balanceSheet` | Balance sheet data over the years |
| `cashFlow` | Cash flow statements |
| `ratios` | Financial ratios (Debtor Days, ROCE, etc.) |
| `shareholding` | Shareholding pattern as two tables: `quarterly` and `yearly` (Promoters, FIIs, DIIs, Government, Public, No. of Shareholders) |
| `documents` | Announcements, annual reports, credit ratings, concalls |
| `CAGRs` | Compounded growth rates (Sales, Profit, Stock Price, ROE) |

### Example: Accessing Specific Data

```javascript
const data = await ScreenerScraperPro("https://www.screener.in/company/TCS/");

// Get pros and cons
console.log(data.analysis.pros);  // ["Company is almost debt free.", ...]
console.log(data.analysis.cons);  // ["Stock is trading at 15x book value", ...]

// Get 5-year compounded sales growth
console.log(data.CAGRs["Compounded Sales Growth"]["5 Years"]);  // "12%"

// Get latest quarter sales
const latestQuarter = data.quarters.headers[data.quarters.headers.length - 1];
console.log(data.quarters.data.Sales[latestQuarter]);  // 64259

// Get annual reports
data.documents.annualReports.forEach(report => {
  console.log(`${report.year}: ${report.link}`);
});
```

## 🤖 Use as an MCP Server

This package also ships an [MCP](https://modelcontextprotocol.io) server, so AI assistants and coding agents like Claude Code, Claude Desktop, Cursor, Antigravity, OpenCode and others can look up Indian stock data for you, e.g. *"Compare FII holding in TCS and Infosys over the last year"*.

### 1. Get the server

```bash
git clone https://github.com/VishwaGauravIn/screener-scraper-pro.git
cd screener-scraper-pro
npm install          # installs dependencies and builds dist/
```


### 2. Connect your agent

**Claude Code**

```bash
claude mcp add screener -- node /path/to/screener-scraper-pro/dist/mcp.js
```

**Claude Desktop, Cursor, Windsurf, Antigravity, Gemini CLI**: these all use the same `mcpServers` format:

```json
{
  "mcpServers": {
    "screener": {
      "command": "node",
      "args": ["/path/to/screener-scraper-pro/dist/mcp.js"]
    }
  }
}
```


Restart the agent after adding the config. Any other MCP client that supports **stdio** servers works the same way: the command is `node` and the argument is the path to `dist/mcp.js`.

### Tools

| Tool | Input | Returns |
|------|-------|---------|
| `search_company` | `query` (company name) | Matching companies and their screener symbols |
| `get_company_overview` | `symbol`, `standalone?` | Name, about, price, market cap, P/E, book value, dividend yield, ROCE, ROE, high/low, pros & cons, CAGRs |
| `get_financials` | `symbol`, `section`, `standalone?` | One table: `quarters`, `profitLoss`, `balanceSheet`, `cashFlow` or `ratios` |
| `get_shareholding` | `symbol`, `period?` (`quarterly` / `yearly` / `both`) | Promoters, FIIs, DIIs, Government, Public %, number of shareholders |
| `get_documents` | `symbol`, `type?`, `limit?` | Announcements, annual reports, credit ratings, concall transcripts |
| `get_full_report` | `symbol`, `standalone?` | Everything (large, ~10k tokens) |

- **Consolidated by default.** Tools return consolidated figures (parent + subsidiaries), like screener.in shows by default. Pass `standalone: true` for the parent company only. If a company has no current consolidated figures, standalone is returned with a `note`. Every response has a `basis` field saying which one you got.
- Results are cached for 10 minutes, so several questions about the same company make one request to screener.in.

## 📋 Sample Full Response

```json
{
  "name": "Reliance Industries Ltd",
  "about": "Reliance was founded by Dhirubhai Ambani and is now promoted and managed by his elder son, Mukesh Dhirubhai Ambani. Ambani's family has about 50% shareholding in the conglomerate.",
  "basis": "standalone",
  "topRatios": {
    "Market Cap": "₹ 18,31,436 Cr.",
    "Current Price": "₹ 1,351",
    "High / Low": "₹ 1,612 / 1,152",
    "Stock P/E": "40.3",
    "Book Value": "₹ 434",
    "Dividend Yield": "0.44 %",
    "ROCE": "7.78 %",
    "ROE": "7.77 %",
    "Face Value": "₹ 10.0"
  },
  "analysis": {
    "pros": [
      "Company has been maintaining a healthy dividend payout of 18.6%"
    ],
    "cons": [
      "Stock is trading at 3.11 times its book value",
      "Company has a low return on equity of 7.59% over last 3 years."
    ]
  },
  "quarters": {
    "headers": [
      "Sep 2023",
      "Dec 2023",
      "Mar 2024",
      "Jun 2024",
      "Sep 2024",
      "Dec 2024",
      "Mar 2025",
      "Jun 2025",
      "Sep 2025",
      "Dec 2025",
      "Mar 2026",
      "Jun 2026",
      "Sep 2026"
    ],
    "data": {
      "Sales": {
        "Sep 2023": 137380,
        "Dec 2023": 127695,
        "Mar 2024": 146832,
        "Jun 2024": 129898,
        "Sep 2024": 130108,
        "Dec 2024": 124381,
        "Mar 2025": 132962,
        "Jun 2025": 116341,
        "Sep 2025": 126335,
        "Dec 2025": 121150,
        "Mar 2026": 141823,
        "Jun 2026": 163631,
        "Sep 2026": 172408
      },
      "YoY Sales growth": {
        "Sep 2023": "+0%",
        "Dec 2023": "+1%",
        "Mar 2024": "+13%",
        "Jun 2024": "+6%",
        "Sep 2024": "-5%",
        "Dec 2024": "-3%",
        "Mar 2025": "-9%",
        "Jun 2025": "-10%",
        "Sep 2025": "-3%",
        "Dec 2025": "-3%",
        "Mar 2026": "+7%",
        "Jun 2026": "+41%",
        "Sep 2026": "+36%"
      },
      "Expenses": {
        "Sep 2023": 118189,
        "Dec 2023": 110137,
        "Mar 2024": 126809,
        "Jun 2024": 115583,
        "Sep 2024": 116683,
        "Dec 2024": 109168,
        "Mar 2025": 117846,
        "Jun 2025": 103171,
        "Sep 2025": 111946,
        "Dec 2025": 106260,
        "Mar 2026": 129861,
        "Jun 2026": 144105,
        "Sep 2026": 150021
      },
      "Operating Profit": {
        "Sep 2023": 19191,
        "Dec 2023": 17558,
        "Mar 2024": 20023,
        "Jun 2024": 14315,
        "Sep 2024": 13425,
        "Dec 2024": 15213,
        "Mar 2025": 15116,
        "Jun 2025": 13170,
        "Sep 2025": 14389,
        "Dec 2025": 14890,
        "Mar 2026": 11962,
        "Jun 2026": 19526,
        "Sep 2026": 22387
      },
      "OPM %": {
        "Sep 2023": "14%",
        "Dec 2023": "14%",
        "Mar 2024": "14%",
        "Jun 2024": "11%",
        "Sep 2024": "10%",
        "Dec 2024": "12%",
        "Mar 2025": "11%",
        "Jun 2025": "11%",
        "Sep 2025": "11%",
        "Dec 2025": "12%",
        "Mar 2026": "8%",
        "Jun 2026": "12%",
        "Sep 2026": "13%"
      },
      "Other Income": {
        "Sep 2023": 2934,
        "Dec 2023": 2969,
        "Mar 2024": 3497,
        "Jun 2024": 3502,
        "Sep 2024": 3801,
        "Dec 2024": 3214,
        "Mar 2025": 5577,
        "Jun 2025": 13460,
        "Sep 2025": 3445,
        "Dec 2025": 3412,
        "Mar 2026": 3357,
        "Jun 2026": 4108,
        "Sep 2026": 3899
      },
      "Interest": {
        "Sep 2023": 3239,
        "Dec 2023": 2982,
        "Mar 2024": 3613,
        "Jun 2024": 2963,
        "Sep 2024": 2662,
        "Dec 2024": 2371,
        "Mar 2025": 2058,
        "Jun 2025": 2194,
        "Sep 2025": 1770,
        "Dec 2025": 1473,
        "Mar 2026": 1467,
        "Jun 2026": 1838,
        "Sep 2026": 1953
      },
      "Depreciation": {
        "Sep 2023": 4384,
        "Dec 2023": 4567,
        "Mar 2024": 4856,
        "Jun 2024": 4708,
        "Sep 2024": 4350,
        "Dec 2024": 4459,
        "Mar 2025": 4464,
        "Jun 2025": 4130,
        "Sep 2025": 4472,
        "Dec 2025": 4434,
        "Mar 2026": 4069,
        "Jun 2026": 4196,
        "Sep 2026": 3994
      },
      "Profit before tax": {
        "Sep 2023": 14502,
        "Dec 2023": 12978,
        "Mar 2024": 15051,
        "Jun 2024": 10146,
        "Sep 2024": 10214,
        "Dec 2024": 11597,
        "Mar 2025": 14171,
        "Jun 2025": 20306,
        "Sep 2025": 11592,
        "Dec 2025": 12395,
        "Mar 2026": 9783,
        "Jun 2026": 17600,
        "Sep 2026": 20339
      },
      "Tax %": {
        "Sep 2023": "23%",
        "Dec 2023": "24%",
        "Mar 2024": "25%",
        "Jun 2024": "25%",
        "Sep 2024": "24%",
        "Dec 2024": "25%",
        "Mar 2025": "21%",
        "Jun 2025": "12%",
        "Sep 2025": "21%",
        "Dec 2025": "24%",
        "Mar 2026": "24%",
        "Jun 2026": "25%",
        "Sep 2026": "25%"
      },
      "Net Profit": {
        "Sep 2023": 11208,
        "Dec 2023": 9924,
        "Mar 2024": 11283,
        "Jun 2024": 7611,
        "Sep 2024": 7713,
        "Dec 2024": 8721,
        "Mar 2025": 11217,
        "Jun 2025": 17904,
        "Sep 2025": 9129,
        "Dec 2025": 9396,
        "Mar 2026": 7422,
        "Jun 2026": 13272,
        "Sep 2026": 15354
      },
      "EPS in Rs": {
        "Sep 2023": 8.28,
        "Dec 2023": 7.33,
        "Mar 2024": 8.34,
        "Jun 2024": 5.62,
        "Sep 2024": 5.7,
        "Dec 2024": 6.44,
        "Mar 2025": 8.29,
        "Jun 2025": 13.23,
        "Sep 2025": 6.75,
        "Dec 2025": 6.94,
        "Mar 2026": 5.48,
        "Jun 2026": 9.81,
        "Sep 2026": 11.35
      }
    }
  },
  "profitLoss": {
    "headers": [
      "Mar 2015",
      "Mar 2016",
      "Mar 2017",
      "Mar 2018",
      "Mar 2019",
      "Mar 2020",
      "Mar 2021",
      "Mar 2022",
      "Mar 2023",
      "Mar 2024",
      "Mar 2025",
      "Mar 2026",
      "TTM"
    ],
    "data": {
      "Sales": {
        "Mar 2015": 328013,
        "Mar 2016": 231743,
        "Mar 2017": 240597,
        "Mar 2018": 289188,
        "Mar 2019": 370744,
        "Mar 2020": 336097,
        "Mar 2021": 245050,
        "Mar 2022": 422413,
        "Mar 2023": 537909,
        "Mar 2024": 531908,
        "Mar 2025": 515425,
        "Mar 2026": 504026,
        "TTM": 599012
      },
      "Sales growth": {
        "Mar 2015": "-16%",
        "Mar 2016": "-29%",
        "Mar 2017": "+4%",
        "Mar 2018": "+20%",
        "Mar 2019": "+28%",
        "Mar 2020": "-9%",
        "Mar 2021": "-27%",
        "Mar 2022": "+72%",
        "Mar 2023": "+27%",
        "Mar 2024": "-1%",
        "Mar 2025": "-3%",
        "Mar 2026": "-2%",
        "TTM": "+20%"
      },
      "Expenses": {
        "Mar 2015": 296377,
        "Mar 2016": 192359,
        "Mar 2017": 197272,
        "Mar 2018": 237430,
        "Mar 2019": 311853,
        "Mar 2020": 283073,
        "Mar 2021": 211542,
        "Mar 2022": 370007,
        "Mar 2023": 471050,
        "Mar 2024": 457488,
        "Mar 2025": 457292,
        "Mar 2026": 449571,
        "TTM": 530247
      },
      "Operating Profit": {
        "Mar 2015": 31636,
        "Mar 2016": 39384,
        "Mar 2017": 43325,
        "Mar 2018": 51758,
        "Mar 2019": 58891,
        "Mar 2020": 53024,
        "Mar 2021": 33508,
        "Mar 2022": 52406,
        "Mar 2023": 66859,
        "Mar 2024": 74420,
        "Mar 2025": 58133,
        "Mar 2026": 54455,
        "TTM": 68765
      },
      "OPM %": {
        "Mar 2015": "10%",
        "Mar 2016": "17%",
        "Mar 2017": "18%",
        "Mar 2018": "18%",
        "Mar 2019": "16%",
        "Mar 2020": "16%",
        "Mar 2021": "14%",
        "Mar 2022": "12%",
        "Mar 2023": "12%",
        "Mar 2024": "14%",
        "Mar 2025": "11%",
        "Mar 2026": "11%",
        "TTM": "11%"
      },
      "Other Income": {
        "Mar 2015": 8687,
        "Mar 2016": 7784,
        "Mar 2017": 8640,
        "Mar 2018": 8203,
        "Mar 2019": 8785,
        "Mar 2020": 9125,
        "Mar 2021": 19114,
        "Mar 2022": 13779,
        "Mar 2023": 12247,
        "Mar 2024": 11973,
        "Mar 2025": 16030,
        "Mar 2026": 23630,
        "TTM": 14776
      },
      "Interest": {
        "Mar 2015": 2367,
        "Mar 2016": 2562,
        "Mar 2017": 2723,
        "Mar 2018": 4656,
        "Mar 2019": 9751,
        "Mar 2020": 12105,
        "Mar 2021": 16211,
        "Mar 2022": 9123,
        "Mar 2023": 12633,
        "Mar 2024": 13430,
        "Mar 2025": 10054,
        "Mar 2026": 6904,
        "TTM": 6731
      },
      "Depreciation": {
        "Mar 2015": 8488,
        "Mar 2016": 8590,
        "Mar 2017": 8465,
        "Mar 2018": 9580,
        "Mar 2019": 10558,
        "Mar 2020": 9728,
        "Mar 2021": 9199,
        "Mar 2022": 10276,
        "Mar 2023": 11167,
        "Mar 2024": 17690,
        "Mar 2025": 17981,
        "Mar 2026": 17105,
        "TTM": 16693
      },
      "Profit before tax": {
        "Mar 2015": 29468,
        "Mar 2016": 36016,
        "Mar 2017": 40777,
        "Mar 2018": 45725,
        "Mar 2019": 47367,
        "Mar 2020": 40316,
        "Mar 2021": 27212,
        "Mar 2022": 46786,
        "Mar 2023": 55306,
        "Mar 2024": 55273,
        "Mar 2025": 46128,
        "Mar 2026": 54076,
        "TTM": 60117
      },
      "Tax %": {
        "Mar 2015": "23%",
        "Mar 2016": "24%",
        "Mar 2017": "23%",
        "Mar 2018": "26%",
        "Mar 2019": "26%",
        "Mar 2020": "23%",
        "Mar 2021": "-17%",
        "Mar 2022": "16%",
        "Mar 2023": "20%",
        "Mar 2024": "24%",
        "Mar 2025": "24%",
        "Mar 2026": "19%"
      },
      "Net Profit": {
        "Mar 2015": 22719,
        "Mar 2016": 27384,
        "Mar 2017": 31425,
        "Mar 2018": 33612,
        "Mar 2019": 35163,
        "Mar 2020": 30903,
        "Mar 2021": 31944,
        "Mar 2022": 39084,
        "Mar 2023": 44190,
        "Mar 2024": 42042,
        "Mar 2025": 35262,
        "Mar 2026": 43851,
        "TTM": 45444
      },
      "EPS in Rs": {
        "Mar 2015": 17.39,
        "Mar 2016": 20.93,
        "Mar 2017": 23.94,
        "Mar 2018": 26.28,
        "Mar 2019": 27.48,
        "Mar 2020": 24.15,
        "Mar 2021": 25.19,
        "Mar 2022": 28.89,
        "Mar 2023": 32.66,
        "Mar 2024": 31.07,
        "Mar 2025": 26.06,
        "Mar 2026": 32.4,
        "TTM": 33.58
      },
      "Dividend Payout %": {
        "Mar 2015": "14%",
        "Mar 2016": "12%",
        "Mar 2017": "11%",
        "Mar 2018": "11%",
        "Mar 2019": "12%",
        "Mar 2020": "13%",
        "Mar 2021": "14%",
        "Mar 2022": "14%",
        "Mar 2023": "14%",
        "Mar 2024": "16%",
        "Mar 2025": "21%",
        "Mar 2026": "19%"
      }
    }
  },
  "balanceSheet": {
    "headers": [
      "Mar 2015",
      "Mar 2016",
      "Mar 2017",
      "Mar 2018",
      "Mar 2019",
      "Mar 2020",
      "Mar 2021",
      "Mar 2022",
      "Mar 2023",
      "Mar 2024",
      "Mar 2025",
      "Mar 2026",
      "Sep 2026"
    ],
    "data": {
      "Equity Capital": {
        "Mar 2015": 3236,
        "Mar 2016": 3240,
        "Mar 2017": 3251,
        "Mar 2018": 6335,
        "Mar 2019": 6339,
        "Mar 2020": 6339,
        "Mar 2021": 6445,
        "Mar 2022": 6765,
        "Mar 2023": 6766,
        "Mar 2024": 6766,
        "Mar 2025": 13532,
        "Mar 2026": 13532,
        "Sep 2026": 13533
      },
      "Reserves": {
        "Mar 2015": 212940,
        "Mar 2016": 250758,
        "Mar 2017": 285062,
        "Mar 2018": 308312,
        "Mar 2019": 398983,
        "Mar 2020": 384876,
        "Mar 2021": 468038,
        "Mar 2022": 464762,
        "Mar 2023": 472312,
        "Mar 2024": 508330,
        "Mar 2025": 529555,
        "Mar 2026": 552703,
        "Sep 2026": 573384
      },
      "Borrowings": {
        "Mar 2015": 97620,
        "Mar 2016": 107104,
        "Mar 2017": 107446,
        "Mar 2018": 116881,
        "Mar 2019": 161720,
        "Mar 2020": 298599,
        "Mar 2021": 224683,
        "Mar 2022": 197439,
        "Mar 2023": 218706,
        "Mar 2024": 214575,
        "Mar 2025": 201505,
        "Mar 2026": 234008,
        "Sep 2026": 247799
      },
      "Other Liabilities": {
        "Mar 2015": 83989,
        "Mar 2016": 120572,
        "Mar 2017": 150987,
        "Mar 2018": 185997,
        "Mar 2019": 208703,
        "Mar 2020": 281885,
        "Mar 2021": 174507,
        "Mar 2022": 209708,
        "Mar 2023": 224876,
        "Mar 2024": 229972,
        "Mar 2025": 277809,
        "Mar 2026": 365566,
        "Sep 2026": 385488
      },
      "Total Liabilities": {
        "Mar 2015": 397785,
        "Mar 2016": 481674,
        "Mar 2017": 546746,
        "Mar 2018": 617525,
        "Mar 2019": 775745,
        "Mar 2020": 971699,
        "Mar 2021": 873673,
        "Mar 2022": 878674,
        "Mar 2023": 922660,
        "Mar 2024": 959643,
        "Mar 2025": 1022401,
        "Mar 2026": 1165809,
        "Sep 2026": 1220204
      },
      "Fixed Assets": {
        "Mar 2015": 114563,
        "Mar 2016": 147543,
        "Mar 2017": 154578,
        "Mar 2018": 200964,
        "Mar 2019": 203188,
        "Mar 2020": 306478,
        "Mar 2021": 306833,
        "Mar 2022": 239626,
        "Mar 2023": 282301,
        "Mar 2024": 299630,
        "Mar 2025": 311047,
        "Mar 2026": 307109,
        "Sep 2026": 317161
      },
      "CWIP": {
        "Mar 2015": 75753,
        "Mar 2016": 110905,
        "Mar 2017": 132741,
        "Mar 2018": 99483,
        "Mar 2019": 111557,
        "Mar 2020": 27965,
        "Mar 2021": 32835,
        "Mar 2022": 34662,
        "Mar 2023": 54357,
        "Mar 2024": 61632,
        "Mar 2025": 82417,
        "Mar 2026": 137569,
        "Sep 2026": 163691
      },
      "Investments": {
        "Mar 2015": 112573,
        "Mar 2016": 157250,
        "Mar 2017": 192450,
        "Mar 2018": 225222,
        "Mar 2019": 331683,
        "Mar 2020": 491823,
        "Mar 2021": 347285,
        "Mar 2022": 408797,
        "Mar 2023": 351141,
        "Mar 2024": 370063,
        "Mar 2025": 390360,
        "Mar 2026": 414613,
        "Sep 2026": 398997
      },
      "Other Assets": {
        "Mar 2015": 94896,
        "Mar 2016": 65976,
        "Mar 2017": 66977,
        "Mar 2018": 91856,
        "Mar 2019": 129317,
        "Mar 2020": 145433,
        "Mar 2021": 186720,
        "Mar 2022": 195589,
        "Mar 2023": 234861,
        "Mar 2024": 228318,
        "Mar 2025": 238577,
        "Mar 2026": 306518,
        "Sep 2026": 340355
      },
      "Total Assets": {
        "Mar 2015": 397785,
        "Mar 2016": 481674,
        "Mar 2017": 546746,
        "Mar 2018": 617525,
        "Mar 2019": 775745,
        "Mar 2020": 971699,
        "Mar 2021": 873673,
        "Mar 2022": 878674,
        "Mar 2023": 922660,
        "Mar 2024": 959643,
        "Mar 2025": 1022401,
        "Mar 2026": 1165809,
        "Sep 2026": 1220204
      }
    }
  },
  "cashFlow": {
    "headers": [
      "Mar 2015",
      "Mar 2016",
      "Mar 2017",
      "Mar 2018",
      "Mar 2019",
      "Mar 2020",
      "Mar 2021",
      "Mar 2022",
      "Mar 2023",
      "Mar 2024",
      "Mar 2025",
      "Mar 2026"
    ],
    "data": {
      "Cash from Operating Activity": {
        "Mar 2015": 35285,
        "Mar 2016": 43447,
        "Mar 2017": 51450,
        "Mar 2018": 62000,
        "Mar 2019": 29191,
        "Mar 2020": 77533,
        "Mar 2021": -512,
        "Mar 2022": 67491,
        "Mar 2023": 55340,
        "Mar 2024": 73998,
        "Mar 2025": 79392,
        "Mar 2026": 79059
      },
      "Cash from Investing Activity": {
        "Mar 2015": -55998,
        "Mar 2016": -41223,
        "Mar 2017": -54949,
        "Mar 2018": -59109,
        "Mar 2019": -53949,
        "Mar 2020": -143583,
        "Mar 2021": 74257,
        "Mar 2022": -45315,
        "Mar 2023": -8678,
        "Mar 2024": -38292,
        "Mar 2025": -28106,
        "Mar 2026": -50451
      },
      "Cash from Financing Activity": {
        "Mar 2015": -940,
        "Mar 2016": -6903,
        "Mar 2017": -1639,
        "Mar 2018": -1914,
        "Mar 2019": 25795,
        "Mar 2020": 70767,
        "Mar 2021": -76657,
        "Mar 2022": -6035,
        "Mar 2023": -7369,
        "Mar 2024": -27465,
        "Mar 2025": -38063,
        "Mar 2026": -2900
      },
      "Net Cash Flow": {
        "Mar 2015": -21653,
        "Mar 2016": -4679,
        "Mar 2017": -5138,
        "Mar 2018": 977,
        "Mar 2019": 1037,
        "Mar 2020": 4717,
        "Mar 2021": -2912,
        "Mar 2022": 16141,
        "Mar 2023": 39293,
        "Mar 2024": 8241,
        "Mar 2025": 13223,
        "Mar 2026": 25708
      },
      "Free Cash Flow": {
        "Mar 2015": -7349,
        "Mar 2016": 23524,
        "Mar 2017": 22636,
        "Mar 2018": 37375,
        "Mar 2019": 4323,
        "Mar 2020": 86214,
        "Mar 2021": -21120,
        "Mar 2022": 49372,
        "Mar 2023": 26162,
        "Mar 2024": 39802,
        "Mar 2025": 42127,
        "Mar 2026": 44933
      },
      "CFO/EBITDA": {
        "Mar 2015": "131%",
        "Mar 2016": "131%",
        "Mar 2017": "141%",
        "Mar 2018": "136%",
        "Mar 2019": "66%",
        "Mar 2020": "156%",
        "Mar 2021": "4%",
        "Mar 2022": "132%",
        "Mar 2023": "90%",
        "Mar 2024": "112%",
        "Mar 2025": "152%",
        "Mar 2026": "160%"
      }
    }
  },
  "ratios": {
    "headers": [
      "Mar 2015",
      "Mar 2016",
      "Mar 2017",
      "Mar 2018",
      "Mar 2019",
      "Mar 2020",
      "Mar 2021",
      "Mar 2022",
      "Mar 2023",
      "Mar 2024",
      "Mar 2025",
      "Mar 2026"
    ],
    "data": {
      "Debtor Days": {
        "Mar 2015": 5,
        "Mar 2016": 6,
        "Mar 2017": 8,
        "Mar 2018": 13,
        "Mar 2019": 12,
        "Mar 2020": 8,
        "Mar 2021": 6,
        "Mar 2022": 12,
        "Mar 2023": 16,
        "Mar 2024": 10,
        "Mar 2025": 11,
        "Mar 2026": 12
      },
      "Inventory Days": {
        "Mar 2015": 50,
        "Mar 2016": 63,
        "Mar 2017": 75,
        "Mar 2018": 71,
        "Mar 2019": 60,
        "Mar 2020": 58,
        "Mar 2021": 78,
        "Mar 2022": 52,
        "Mar 2023": 77,
        "Mar 2024": 79,
        "Mar 2025": 84,
        "Mar 2026": 101
      },
      "Days Payable": {
        "Mar 2015": 75,
        "Mar 2016": 123,
        "Mar 2017": 151,
        "Mar 2018": 160,
        "Mar 2019": 119,
        "Mar 2020": 106,
        "Mar 2021": 180,
        "Mar 2022": 151,
        "Mar 2023": 108,
        "Mar 2024": 121,
        "Mar 2025": 115,
        "Mar 2026": 141
      },
      "Cash Conversion Cycle": {
        "Mar 2015": -19,
        "Mar 2016": -54,
        "Mar 2017": -67,
        "Mar 2018": -76,
        "Mar 2019": -48,
        "Mar 2020": -40,
        "Mar 2021": -96,
        "Mar 2022": -87,
        "Mar 2023": -15,
        "Mar 2024": -32,
        "Mar 2025": -20,
        "Mar 2026": -29
      },
      "Working Capital Days": {
        "Mar 2015": -41,
        "Mar 2016": -128,
        "Mar 2017": -152,
        "Mar 2018": -155,
        "Mar 2019": -111,
        "Mar 2020": -263,
        "Mar 2021": -136,
        "Mar 2022": -68,
        "Mar 2023": -77,
        "Mar 2024": -79,
        "Mar 2025": -91,
        "Mar 2026": -116
      },
      "ROCE %": {
        "Mar 2015": "10%",
        "Mar 2016": "11%",
        "Mar 2017": "10%",
        "Mar 2018": "12%",
        "Mar 2019": "11%",
        "Mar 2020": "9%",
        "Mar 2021": "6%",
        "Mar 2022": "8%",
        "Mar 2023": "10%",
        "Mar 2024": "10%",
        "Mar 2025": "8%",
        "Mar 2026": "8%"
      }
    }
  },
  "shareholding": {
    "quarterly": {
      "headers": [
        "Dec 2023",
        "Mar 2024",
        "Jun 2024",
        "Sep 2024",
        "Dec 2024",
        "Mar 2025",
        "Jun 2025",
        "Sep 2025",
        "Dec 2025",
        "Mar 2026",
        "Jun 2026",
        "Sep 2026"
      ],
      "data": {
        "Promoters": {
          "Dec 2023": "50.30%",
          "Mar 2024": "50.31%",
          "Jun 2024": "50.33%",
          "Sep 2024": "50.24%",
          "Dec 2024": "50.13%",
          "Mar 2025": "50.10%",
          "Jun 2025": "50.07%",
          "Sep 2025": "50.01%",
          "Dec 2025": "50.00%",
          "Mar 2026": "50.00%",
          "Jun 2026": "50.48%",
          "Sep 2026": "50.44%"
        },
        "FIIs": {
          "Dec 2023": "22.13%",
          "Mar 2024": "22.06%",
          "Jun 2024": "21.75%",
          "Sep 2024": "21.30%",
          "Dec 2024": "19.16%",
          "Mar 2025": "19.07%",
          "Jun 2025": "19.21%",
          "Sep 2025": "18.65%",
          "Dec 2025": "19.09%",
          "Mar 2026": "18.67%",
          "Jun 2026": "17.19%",
          "Sep 2026": "16.67%"
        },
        "DIIs": {
          "Dec 2023": "16.59%",
          "Mar 2024": "16.98%",
          "Jun 2024": "17.30%",
          "Sep 2024": "17.61%",
          "Dec 2024": "19.02%",
          "Mar 2025": "19.36%",
          "Jun 2025": "19.72%",
          "Sep 2025": "20.25%",
          "Dec 2025": "20.10%",
          "Mar 2026": "20.46%",
          "Jun 2026": "21.10%",
          "Sep 2026": "21.62%"
        },
        "Government": {
          "Dec 2023": "0.18%",
          "Mar 2024": "0.19%",
          "Jun 2024": "0.19%",
          "Sep 2024": "0.19%",
          "Dec 2024": "0.18%",
          "Mar 2025": "0.17%",
          "Jun 2025": "0.17%",
          "Sep 2025": "0.17%",
          "Dec 2025": "0.17%",
          "Mar 2026": "0.17%",
          "Jun 2026": "0.17%",
          "Sep 2026": "0.17%"
        },
        "Public": {
          "Dec 2023": "10.80%",
          "Mar 2024": "10.46%",
          "Jun 2024": "10.43%",
          "Sep 2024": "10.67%",
          "Dec 2024": "11.52%",
          "Mar 2025": "11.29%",
          "Jun 2025": "10.84%",
          "Sep 2025": "10.92%",
          "Dec 2025": "10.64%",
          "Mar 2026": "10.70%",
          "Jun 2026": "11.05%",
          "Sep 2026": "11.08%"
        },
        "No. of Shareholders": {
          "Dec 2023": 3613814,
          "Mar 2024": 3463276,
          "Jun 2024": 3493125,
          "Sep 2024": 3834968,
          "Dec 2024": 4714959,
          "Mar 2025": 4765728,
          "Jun 2025": 4435756,
          "Sep 2025": 4393764,
          "Dec 2025": 4206159,
          "Mar 2026": 4421289,
          "Jun 2026": 4651863,
          "Sep 2026": 5072457
        }
      }
    },
    "yearly": {
      "headers": [
        "Mar 2017",
        "Mar 2018",
        "Mar 2019",
        "Mar 2020",
        "Mar 2021",
        "Mar 2022",
        "Mar 2023",
        "Mar 2024",
        "Mar 2025",
        "Mar 2026",
        "Sep 2026"
      ],
      "data": {
        "Promoters": {
          "Mar 2017": "46.32%",
          "Mar 2018": "47.45%",
          "Mar 2019": "47.27%",
          "Mar 2020": "50.07%",
          "Mar 2021": "50.58%",
          "Mar 2022": "50.66%",
          "Mar 2023": "50.41%",
          "Mar 2024": "50.31%",
          "Mar 2025": "50.10%",
          "Mar 2026": "50.00%",
          "Sep 2026": "50.44%"
        },
        "FIIs": {
          "Mar 2017": "22.58%",
          "Mar 2018": "24.46%",
          "Mar 2019": "24.39%",
          "Mar 2020": "24.08%",
          "Mar 2021": "25.66%",
          "Mar 2022": "24.23%",
          "Mar 2023": "22.49%",
          "Mar 2024": "22.06%",
          "Mar 2025": "19.07%",
          "Mar 2026": "18.67%",
          "Sep 2026": "16.67%"
        },
        "DIIs": {
          "Mar 2017": "11.85%",
          "Mar 2018": "11.23%",
          "Mar 2019": "11.86%",
          "Mar 2020": "13.78%",
          "Mar 2021": "12.62%",
          "Mar 2022": "14.23%",
          "Mar 2023": "16.06%",
          "Mar 2024": "16.98%",
          "Mar 2025": "19.36%",
          "Mar 2026": "20.46%",
          "Sep 2026": "21.62%"
        },
        "Government": {
          "Mar 2017": "0.14%",
          "Mar 2018": "0.15%",
          "Mar 2019": "0.18%",
          "Mar 2020": "0.20%",
          "Mar 2021": "0.20%",
          "Mar 2022": "0.17%",
          "Mar 2023": "0.16%",
          "Mar 2024": "0.19%",
          "Mar 2025": "0.17%",
          "Mar 2026": "0.17%",
          "Sep 2026": "0.17%"
        },
        "Public": {
          "Mar 2017": "19.12%",
          "Mar 2018": "16.72%",
          "Mar 2019": "16.29%",
          "Mar 2020": "11.87%",
          "Mar 2021": "10.94%",
          "Mar 2022": "10.71%",
          "Mar 2023": "10.89%",
          "Mar 2024": "10.46%",
          "Mar 2025": "11.29%",
          "Mar 2026": "10.70%",
          "Sep 2026": "11.08%"
        },
        "No. of Shareholders": {
          "Mar 2017": 2501302,
          "Mar 2018": 2266000,
          "Mar 2019": 2211231,
          "Mar 2020": 2632168,
          "Mar 2021": 3031272,
          "Mar 2022": 3327847,
          "Mar 2023": 3639396,
          "Mar 2024": 3463276,
          "Mar 2025": 4765728,
          "Mar 2026": 4421289,
          "Sep 2026": 5072457
        }
      }
    }
  },
  "documents": {
    "announcements": [
      {
        "title": "Update On Institutional Investors'' Meeting - Morgan Stanley 25Th Annual Asia-Pacific Summit",
        "description": "",
        "link": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=3c911ae3-537d-4dad-b536-c6c8337562ee.pdf"
      },
      {
        "title": "Update On Institutional Investors'' Meeting - JM Financial India Conference",
        "description": "",
        "link": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=eadec632-3d3c-49bd-8f85-6d26d79a4332.pdf"
      },
      {
        "title": "Update On Institutional Investors'' Meeting - CLSA India Forum",
        "description": "",
        "link": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=c3e0b430-7329-4925-8c6f-a9a1967bc0f9.pdf"
      },
      {
        "title": "Announcement under Regulation 30 (LODR)-Analyst / Investor Meet - Intimation",
        "description": "",
        "link": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=3f614a9e-94b0-42ef-8145-ba0055ba7be5.pdf"
      },
      {
        "title": "Announcement under Regulation 30 (LODR)-Analyst / Investor Meet - Intimation",
        "description": "",
        "link": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=55f9d4f5-8638-4669-abdb-7cc4127221fc.pdf"
      }
    ],
    "annualReports": [
      {
        "year": "Annual Report 2026",
        "source": "",
        "link": "https://www.bseindia.com/xml-data/corpfiling/AttachHis/cc08294f-ec68-4f15-aaa4-c14a3c4bdfb2.pdf"
      },
      {
        "year": "Annual Report 2025",
        "source": "",
        "link": "https://www.bseindia.com/xml-data/corpfiling/AttachHis/468b09a3-a212-4066-bbaa-4b0ba524d2ce.pdf"
      },
      {
        "year": "Annual Report 2024",
        "source": "",
        "link": "https://www.bseindia.com/xml-data/corpfiling/AttachHis/d473280d-1c2b-4037-8ff9-dfbb82aa2c7e.pdf"
      },
      {
        "year": "Annual Report 2023",
        "source": "",
        "link": "https://www.bseindia.com/xml-data/corpfiling/AttachHis/b55b5dfc-a3bf-4f24-9d7f-ca09774a1dd9.pdf"
      },
      {
        "year": "Annual Report 2022",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/74185500325.pdf"
      },
      {
        "year": "Annual Report 2021",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/68509500325.pdf"
      },
      {
        "year": "Annual Report 2020",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/5003250320.pdf"
      },
      {
        "year": "Annual Report 2019",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/5003250319.pdf"
      },
      {
        "year": "Annual Report 2018",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/5003250318.pdf"
      },
      {
        "year": "Annual Report 2017",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/5003250317.pdf"
      },
      {
        "year": "Annual Report 2016",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/5003250316.pdf"
      },
      {
        "year": "Annual Report 2015",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/5003250315.pdf"
      },
      {
        "year": "Annual Report 2014",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/5003250314.pdf"
      },
      {
        "year": "Annual Report 2013",
        "source": "",
        "link": "https://archives.nseindia.com/annual_reports/AR_19_RELIANCE_2012_2013_08052013171218.zip"
      },
      {
        "year": "Annual Report 2013",
        "source": "",
        "link": "https://www.bseindia.com/bseplus/AnnualReport/500325/5003250313.pdf"
      }
    ],
    "creditRatings": [
      {
        "title": "Rating update",
        "date": "21 Oct",
        "source": "icra",
        "link": "https://www.icra.in/Rationale/ShowRationaleReport/?Id=146410"
      },
      {
        "title": "Rating update",
        "date": "30 Sep",
        "source": "crisil",
        "link": "https://www.crisil.com/mnt/winshare/Ratings/RatingList/RatingDocs/RelianceIndustriesLimited_September 30_ 2026_RR_406260.html"
      },
      {
        "title": "Rating update",
        "date": "28 Sep",
        "source": "crisil",
        "link": "https://www.crisil.com/mnt/winshare/Ratings/RatingList/RatingDocs/RelianceIndustriesLimited_September 28_ 2026_RR_406111.html"
      },
      {
        "title": "Rating update",
        "date": "25 Sep",
        "source": "care",
        "link": "https://www.careratings.com/upload/CompanyFiles/PR/202609120933_Reliance_Industries_Limited.pdf"
      },
      {
        "title": "Rating update",
        "date": "25 Sep",
        "source": "crisil",
        "link": "https://www.crisil.com/mnt/winshare/Ratings/RatingList/RatingDocs/RelianceIndustriesLimited_September 25_ 2026_RR_405969.html"
      },
      {
        "title": "Rating update",
        "date": "9 Sep",
        "source": "crisil",
        "link": "https://www.crisil.com/mnt/winshare/Ratings/RatingList/RatingDocs/RelianceIndustriesLimited_September 09_ 2026_RR_405123.html"
      }
    ],
    "concalls": [
      {
        "month": "Nov 2026",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=8e997741-4d35-4188-933a-cf020fb9c816.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=0dc8ebe7-5e2d-4946-85ee-1e536c461a71.pdf",
        "recording": "https://www.youtube.com/watch?v=oFwscHIl-fw"
      },
      {
        "month": "Jul 2026",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=c9d3d96a-8b04-4b41-b454-3f98d1f90702.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=01d1656c-cf53-4d52-94c3-7ed0edd50271.pdf"
      },
      {
        "month": "Apr 2026",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=971d8c86-397a-4780-b843-5a84d3006d0b.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=5145c56f-ff81-4812-9663-f9b2461c4b2c.pdf"
      },
      {
        "month": "Jan 2026",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=26290395-526a-441f-a347-c8ac12e4adf3.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=d0e06e07-5a3e-4bc0-a6a6-76635bc53238.pdf",
        "recording": "https://www.youtube.com/watch?v=k7YqZJ4TY8A"
      },
      {
        "month": "Oct 2025",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=f2454c0f-aad9-4d23-add0-dfe3d49aa8d6.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=b74bb5fb-c15b-42f1-b853-34231e587f46.pdf",
        "recording": "https://youtu.be/mU39C6sNUNM"
      },
      {
        "month": "Oct 2025",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=7a050d55-ad53-4d57-8735-cbcf20bb412b.pdf"
      },
      {
        "month": "Aug 2025",
        "recording": "https://www.youtube.com/live/4Y1cd2SLoo8?si=b4cZ3ALJKDyHxM2b"
      },
      {
        "month": "Jul 2025",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=38a33049-ed9e-4544-ace5-a92e5f984f23.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=49a01d99-854c-4c3a-b62c-e1fb3619029f.pdf"
      },
      {
        "month": "Apr 2025",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=b6203612-be21-4d28-ace9-6496cd3fb8b2.pdf"
      },
      {
        "month": "Apr 2025",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=3e36b485-0a6c-4f84-bf74-7d60b0e26d9d.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=ac3d5e8f-9a84-4510-99e8-71eabcf49a01.pdf",
        "recording": "https://www.youtube.com/watch?v=Tj8c9UfTdXw"
      },
      {
        "month": "Jan 2025",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=aa0547ba-09ef-404d-b57d-c216d1513f17.pdf"
      },
      {
        "month": "Jan 2025",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=89c33a3e-5683-4a1d-b8f9-1952ff4df63f.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=cb5da39b-b46a-45f7-b2b6-932a4f2ecf91.pdf"
      },
      {
        "month": "Oct 2024",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=0e6309fa-450f-4db6-88b2-d76d9a3ff756.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=fd1fe004-0eb0-4a2b-9859-7b62a89e451c.pdf"
      },
      {
        "month": "Aug 2024",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=9364b18a-7921-4029-bcfa-78921cd7807e.pdf"
      },
      {
        "month": "Jul 2024",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=191e6ab9-4751-4017-ba5f-bb63daf2d871.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=24faf885-ece1-4852-b0fe-91fc8643dc1c.pdf"
      },
      {
        "month": "Apr 2024",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=06b05d06-8c38-4aee-aa5b-5e7108ae3871.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=0501df4e-7d64-455d-bbb0-4b2118067e51.pdf",
        "recording": "https://www.ril.com/investors/events-presentations#webcast-sec"
      },
      {
        "month": "Jan 2024",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=de3e8ff3-efca-4266-9bc8-7509f48574a4.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=1cb66ca2-dfd5-4f46-986f-03b0661bd486.pdf"
      },
      {
        "month": "Oct 2023",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=ef9baa21-923a-48ad-9fb7-2157af59ae16.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=f9c9eba2-4b08-430f-a3a0-0dd5419b7f8f.pdf"
      },
      {
        "month": "Aug 2023",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=7cf2df9a-51bb-45d4-9004-3cad20b5920b.pdf"
      },
      {
        "month": "Jul 2023",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=f2fa506f-675b-46db-9f7b-26303a05d6b9.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=dc6d4a06-e2bc-4df4-8b8a-5db0f50b1918.pdf"
      },
      {
        "month": "Apr 2023",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=9c8c3f07-883a-476b-8fb2-8fe74078e9f5.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=7c228ccc-99ad-4bd9-be72-0a746c30ebee.pdf"
      },
      {
        "month": "Jan 2023",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=dfb275bd-fd47-4a38-964e-21a67e26b3c2.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=1ef9c86c-8f99-4791-a677-ea8a65e4ef28.pdf"
      },
      {
        "month": "Oct 2022",
        "transcript": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=aa7a60c6-791d-4e59-94e6-9f94c3a506fc.pdf",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=d6182ad1-6f8e-4112-b865-984ea1035107.pdf"
      },
      {
        "month": "Jul 2022",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=9e81c058-6b85-4f18-ba5a-bbdd72156edf.pdf"
      },
      {
        "month": "May 2022",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=bf7646f7-940a-429b-b3eb-0625715f6aeb.pdf"
      },
      {
        "month": "Feb 2022",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=7d172a7c-9056-4588-ad0c-d5c114ff902a.pdf"
      },
      {
        "month": "Jan 2022",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=6047c516-bdab-4a88-9103-81d6ddad23d5.pdf"
      },
      {
        "month": "Oct 2021",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=1008c763-0d31-4432-a031-6dd4afda0c72.pdf"
      },
      {
        "month": "Jul 2021",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=33e997e6-025e-478e-b71f-fb59dca2a4ef.pdf"
      },
      {
        "month": "Apr 2021",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=b9139079-b211-4486-a604-ef5b85a7985e.pdf"
      },
      {
        "month": "Feb 2021",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=caff4f40-fd8f-49ae-929c-f5dae4c98ec3.pdf"
      },
      {
        "month": "Feb 2021",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=4c079f28-425e-4fb4-a830-ae9f4fde355d.pdf"
      },
      {
        "month": "Jan 2021",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=c44095c1-55cb-4048-a235-6f776dd054e9.pdf"
      },
      {
        "month": "Jan 2021",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=ee845952-2c47-4abc-b15a-ab759c068efe.pdf"
      },
      {
        "month": "Oct 2020",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=ef91573e-ebb9-4257-8209-b684d9380a3e.pdf"
      },
      {
        "month": "Jul 2020",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=c9c7754a-ab5a-4463-a5cb-3baafbef135d.pdf"
      },
      {
        "month": "May 2020",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=8841c2b4-6659-4ea6-aefd-9874fee15705.pdf"
      },
      {
        "month": "Jan 2020",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=a738dab1-1698-4a4f-b863-148b5c5023e0.pdf"
      },
      {
        "month": "Oct 2019",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=5f6d2f75-5b1f-4c8b-87eb-34e3c8246fb1.pdf"
      },
      {
        "month": "Oct 2019",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=bcf1b986-0d58-4126-b3fa-cf67e7b44e14.pdf"
      },
      {
        "month": "Apr 2019",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=05c527f3-c7ff-4e83-a2b3-d7d92b20969d.pdf"
      },
      {
        "month": "Jan 2019",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=040c976b-6d40-4903-905e-27820f21eb05.pdf"
      },
      {
        "month": "Oct 2018",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=d71a237f-6917-4594-969d-cfd62d1849d9.pdf"
      },
      {
        "month": "Apr 2018",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=e0357498-61d2-405d-98c9-02a1e83b556b.pdf"
      },
      {
        "month": "Jan 2018",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=1a49913c-4798-4f48-ab39-e187ea89caf2.pdf"
      },
      {
        "month": "Oct 2017",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=421cf002-f53b-4c1c-a8be-de2fdda6fd05.pdf"
      },
      {
        "month": "Jun 2016",
        "ppt": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=6669EE6F_088E_4C15_9839_E2DBB861749D_110427.pdf"
      }
    ]
  },
  "CAGRs": {
    "Compounded Sales Growth": {
      "10 Years": "8%",
      "5 Years": "16%",
      "3 Years": "-2%",
      "TTM": "20%"
    },
    "Compounded Profit Growth": {
      "10 Years": "5%",
      "5 Years": "9%",
      "3 Years": "-2%",
      "TTM": "16%"
    },
    "Stock Price CAGR": {
      "10 Years": "20%",
      "5 Years": "5%",
      "3 Years": "4%",
      "1 Year": "-13%"
    },
    "Return on Equity": {
      "10 Years": "8%",
      "5 Years": "8%",
      "3 Years": "8%",
      "Last Year": "8%"
    }
  }
}
```

## 🔗 Supported URL Formats

The package supports various screener.in URL formats:

```javascript
// Standard company page
"https://www.screener.in/company/RELIANCE/"

// Consolidated financials
"https://www.screener.in/company/RELIANCE/consolidated/"

// By BSE/NSE code
"https://www.screener.in/company/500325/"
```

## ⚠️ Important Notes

- **Standalone vs consolidated:** `/company/RELIANCE/` returns standalone figures (parent company only); `/company/RELIANCE/consolidated/` returns consolidated figures (parent + subsidiaries). For companies with subsidiaries these can differ a lot, and screener.in in the browser usually shows consolidated. Check the `basis` field.
- `ScreenerScraperPro` throws an error if the page can't be fetched (e.g. HTTP 404 for an unknown symbol) or isn't a company page, so wrap calls in `try/catch`.
- This package scrapes publicly available data from screener.in
- Respect screener.in's terms of service and rate limits
- Data accuracy depends on screener.in's data
- Some sections may be empty if the company doesn't have that data available

## 🛠️ Requirements

- Node.js 18.0 or higher (uses native `fetch`)
- ES Modules support

## 📄 License

GPL-3.0 - See [LICENSE](LICENSE) for details.

## 🐛 Issues & Contributions

Found a bug or want to contribute? Please open an issue or pull request on [GitHub](https://github.com/VishwaGauravIn/screener-scraper-pro).
