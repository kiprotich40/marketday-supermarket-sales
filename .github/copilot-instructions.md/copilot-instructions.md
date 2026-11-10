# Marketday Workspace Guidance

- Keep this project dependency-free and browser-based with plain HTML, CSS, and JavaScript unless a framework is explicitly requested.
- Preserve the dashboard's seven-day demand formula: average daily sales over the latest seven days multiplied by seven. Stock cover is current stock divided by average daily sales.
- When changing sales or stock behavior, update the forecast, inventory status, dashboard metrics, recent activity, and browser persistence consistently.
- Persist application data in browser local storage. Keep demo reset behavior available.
- Run the app by opening `index.html`; use `README.md` for current project details. No build task is needed for the static app.
