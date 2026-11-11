// Fetches daily closing prices and the USD/CAD rate from Alpha Vantage
// and writes data.json for the Stock Watch page.
// Free Alpha Vantage keys allow 25 requests a day; this uses 7.
import { writeFile, readFile } from "node:fs/promises";

const KEY = process.env.ALPHAVANTAGE_API_KEY;
if (!KEY) { console.error("Missing ALPHAVANTAGE_API_KEY secret."); process.exit(1); }

const TICKERS = ["AMZN", "NVDA", "COST", "MU", "MELI", "TTWO"];
const KEEP = 23; // trading days of history to keep
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function av(params) {
  const url = "https://www.alphavantage.co/query?" + new URLSearchParams({ ...params, apikey: KEY });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json["Note"] || json["Information"] || json["Error Message"]) {
    throw new Error(json["Note"] || json["Information"] || json["Error Message"]);
  }
  return json;
}

let previous = {};
try { previous = JSON.parse(await readFile("data.json", "utf8")); } catch {}

const out = { updated: new Date().toISOString(), stocks: { ...(previous.stocks || {}) }, rate: previous.rate || null, errors: [] };

for (const t of TICKERS) {
  try {
    const j = await av({ function: "TIME_SERIES_DAILY", symbol: t, outputsize: "compact" });
    const series = j["Time Series (Daily)"];
    const rows = Object.entries(series)
      .map(([d, v]) => [d, Number(v["4. close"])])
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-KEEP);
    out.stocks[t] = { hist: rows, price: rows.at(-1)[1], date: rows.at(-1)[0] };
    console.log(t, rows.at(-1));
  } catch (e) {
    out.errors.push(`${t}: ${e.message}`);
    console.error(t, e.message);
  }
  await sleep(15000); // stay under 5 requests a minute
}

try {
  const j = await av({ function: "CURRENCY_EXCHANGE_RATE", from_currency: "USD", to_currency: "CAD" });
  const r = Number(j["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
  if (r > 0) out.rate = { usdcad: r, at: j["Realtime Currency Exchange Rate"]["6. Last Refreshed"] };
} catch (e) {
  out.errors.push(`USDCAD: ${e.message}`);
}

await writeFile("data.json", JSON.stringify(out, null, 2) + "\n");
console.log("Wrote data.json", out.errors.length ? out.errors : "");
if (Object.keys(out.stocks).length === 0) process.exit(1);
