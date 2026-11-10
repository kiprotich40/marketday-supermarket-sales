# Marketday

A small supermarket sales and demand dashboard. It tracks sales and shelf quantities, estimates customer demand for the next seven days, and highlights products that may need replenishing.

## Run it

Open `index.html` in a modern browser. No build step, account, or server is required. Google Fonts are optional; the dashboard still works if they are unavailable.

## What it does

- Shows today's gross sales and units sold, weekly movement, stock alerts, and estimated seven-day demand.
- Forecasts each product's seven-day demand as its average daily sales over the last seven days multiplied by seven.
- Estimates stock cover as current stock divided by average daily sales. Products under three days are marked **Restock now**; products under seven days are marked **Watch stock**.
- Records sales and restocks, updates on-hand quantities, and refreshes the dashboard immediately.
- Filters inventory by product name and category.
- Saves changes in the browser's local storage.

## Demo data and reset

The project starts with sample supermarket products and a week of sales history. Use the circular-arrow button in the header to restore the original demo data. Data is local to the browser and is not shared between devices or users.
