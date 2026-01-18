# Screener Scraper Pro

Effortlessly scrape comprehensive financial data from [screener.in](https://www.screener.in) and use it in your projects. **No API key required.**

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
| `analysis` | Pros and cons extracted from screener's analysis |
| `quarters` | Quarterly results (Sales, Expenses, Profit, EPS, etc.) |
| `profitLoss` | Annual profit & loss statements |
| `balanceSheet` | Balance sheet data over the years |
| `cashFlow` | Cash flow statements |
| `ratios` | Financial ratios (Debtor Days, ROCE, etc.) |
| `shareholding` | Shareholding pattern changes |
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

## 📋 Sample Response

<!-- Add your sample response JSON here -->

```json

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
