# Stock Watch

A ranked watchlist of stocks with upcoming catalysts. Tap a stock to see the reasons, a price simulation, a projected path and a sell plan, in CAD or USD.

## How it updates

- **Prices and the USD/CAD rate:** a GitHub Action (`.github/workflows/update.yml`) runs every weekday at 5:30 p.m. Toronto time. It fetches closing prices from Alpha Vantage and saves them to `data.json`, and the page loads that file. It uses 7 of the 25 free daily requests.
- **Rankings, reasons and projected paths** are written into `index.html` and change only when they're edited.

## Setup

1. Add a repository secret named `ALPHAVANTAGE_API_KEY` (Settings → Secrets and variables → Actions) with your free key from alphavantage.co.
2. Turn on GitHub Pages (Settings → Pages → Deploy from a branch → `main`, folder `/`).
3. Run the workflow once by hand (Actions → Update prices → Run workflow).

Not financial advice: the projections are simulations and opinion.
