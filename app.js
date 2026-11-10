const STORAGE_KEY = 'marketday-store-v1';
const DAY_MS = 24 * 60 * 60 * 1000;

const seedProducts = [
  { id: 'pasta', name: 'Penne pasta', category: 'Pantry', emoji: '🍝', price: 2.49, stock: 58, dailySales: [8, 10, 9, 12, 11, 13, 12] },
  { id: 'milk', name: 'Whole milk, 1 gal', category: 'Dairy', emoji: '🥛', price: 4.29, stock: 22, dailySales: [13, 15, 14, 17, 16, 18, 19] },
  { id: 'apples', name: 'Honeycrisp apples', category: 'Produce', emoji: '🍎', price: 1.19, stock: 41, dailySales: [9, 12, 11, 13, 12, 15, 14] },
  { id: 'bread', name: 'Sourdough loaf', category: 'Bakery', emoji: '🍞', price: 5.49, stock: 10, dailySales: [8, 9, 11, 10, 12, 13, 14] },
  { id: 'eggs', name: 'Free-range eggs', category: 'Dairy', emoji: '🥚', price: 5.99, stock: 16, dailySales: [7, 9, 8, 10, 11, 12, 13] },
  { id: 'coffee', name: 'House blend coffee', category: 'Pantry', emoji: '☕', price: 12.99, stock: 36, dailySales: [5, 6, 8, 7, 9, 8, 10] },
  { id: 'tomatoes', name: 'Roma tomatoes', category: 'Produce', emoji: '🍅', price: 0.89, stock: 19, dailySales: [10, 11, 9, 12, 14, 13, 15] },
  { id: 'soap', name: 'Hand soap', category: 'Household', emoji: '🧼', price: 3.79, stock: 44, dailySales: [3, 5, 4, 6, 5, 7, 6] },
  { id: 'yogurt', name: 'Greek yogurt', category: 'Dairy', emoji: '🥣', price: 1.79, stock: 28, dailySales: [6, 8, 7, 9, 10, 9, 11] }
];

const productById = (id) => state.products.find((product) => product.id === id);
const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const formatDate = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
const numberFormat = new Intl.NumberFormat('en-US');

function makeInitialState() {
  const products = seedProducts.map((product) => ({ ...product, dailySales: [...product.dailySales] }));
  const transactions = [];
  products.forEach((product) => {
    product.dailySales.forEach((units, index) => {
      if (!units) return;
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      transactions.push({
        id: `${product.id}-${localDateKey(date)}`,
        productId: product.id,
        units,
        date: date.toISOString(),
        kind: 'sale'
      });
    });
  });
  return { products, transactions };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return makeInitialState();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.products) || !Array.isArray(parsed.transactions)) return makeInitialState();
    return parsed;
  } catch {
    return makeInitialState();
  }
}

let state = loadState();
let toastTimer;
const elements = {
  inventoryBody: document.querySelector('#inventory-body'),
  restockList: document.querySelector('#restock-list'),
  activityList: document.querySelector('#activity-list'),
  search: document.querySelector('#product-search'),
  category: document.querySelector('#category-filter'),
  dialog: document.querySelector('#action-dialog'),
  form: document.querySelector('#action-form'),
  actionType: document.querySelector('#action-type'),
  actionProduct: document.querySelector('#action-product'),
  actionQuantity: document.querySelector('#action-quantity'),
  productContext: document.querySelector('#product-context'),
  formError: document.querySelector('#form-error'),
  dialogTitle: document.querySelector('#dialog-title'),
  dialogKicker: document.querySelector('#dialog-kicker'),
  dialogDescription: document.querySelector('#dialog-description'),
  dialogSubmit: document.querySelector('#dialog-submit'),
  toast: document.querySelector('#toast')
};

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getProductMetrics(product) {
  const sold = product.dailySales.reduce((sum, units) => sum + units, 0);
  const average = sold / 7;
  const demand = Math.ceil(average * 7);
  const cover = average > 0 ? product.stock / average : Infinity;
  const status = cover < 3 ? 'low' : cover < 7 ? 'watch' : 'healthy';
  return { sold, average, demand, cover, status };
}

function getAlertProducts() {
  return state.products
    .map((product) => ({ product, metrics: getProductMetrics(product) }))
    .filter(({ metrics }) => metrics.status !== 'healthy')
    .sort((left, right) => left.metrics.cover - right.metrics.cover);
}

function renderDate() {
  const today = new Date();
  document.querySelector('#today-label').textContent = `STORE PULSE  /  ${new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(today).toUpperCase()}`;
}

function renderMetrics() {
  const todayKey = localDateKey();
  let units = 0;
  let revenue = 0;
  let demand = 0;
  state.products.forEach((product) => {
    const todayUnits = product.dailySales[6] || 0;
    units += todayUnits;
    revenue += todayUnits * product.price;
    demand += getProductMetrics(product).demand;
  });
  const alerts = getAlertProducts();
  document.querySelector('#today-revenue').textContent = formatMoney(revenue);
  document.querySelector('#today-units').textContent = numberFormat.format(units);
  document.querySelector('#stock-alerts').textContent = numberFormat.format(alerts.length);
  document.querySelector('#alert-note').textContent = alerts.length ? `${alerts.length} items below 7 days of cover` : 'All items have healthy cover';
  document.querySelector('#forecast-total').innerHTML = `${numberFormat.format(demand)} <small>units</small>`;
  document.querySelector('#nav-alert-count').textContent = alerts.length;
  document.querySelector('#revenue-note').textContent = `Gross sales recorded ${todayKey === localDateKey() ? 'today' : 'recently'}`;
}

function renderChart() {
  const dailyTotals = Array.from({ length: 7 }, (_, index) => state.products.reduce((sum, product) => sum + (product.dailySales[index] || 0), 0));
  const max = Math.max(...dailyTotals, 1);
  const step = Math.ceil(max / 3);
  document.querySelector('#axis-top').textContent = numberFormat.format(step * 3);
  document.querySelector('#axis-mid').textContent = numberFormat.format(step * 2);
  document.querySelector('#weekly-units').textContent = numberFormat.format(dailyTotals.reduce((sum, units) => sum + units, 0));
  document.querySelector('#chart-insight').textContent = dailyTotals[6] >= dailyTotals[5] ? 'Demand is picking up' : 'A quieter day so far';
  const chart = document.querySelector('#sales-chart');
  const today = new Date();
  chart.innerHTML = dailyTotals.map((units, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    const height = Math.max(2, (units / (step * 3)) * 100);
    const label = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    return `<div class="chart-column${index === 6 ? ' is-today' : ''}" title="${label}: ${units} units"><div class="chart-bar" style="height:${height}%"></div><span class="chart-label">${label}</span></div>`;
  }).join('');
}

function iconClass(category) {
  return category.toLowerCase();
}

function renderRestockList() {
  const alerts = getAlertProducts().slice(0, 3);
  const list = elements.restockList;
  if (!alerts.length) {
    list.innerHTML = '<div class="empty-state"><strong>Shelves look ready.</strong><span>No items are forecast to run low this week.</span></div>';
  } else {
    list.innerHTML = alerts.map(({ product, metrics }) => `
      <div class="focus-item">
        <span class="product-icon ${iconClass(product.category)}" aria-hidden="true">${product.emoji}</span>
        <span><span class="focus-name">${product.name}</span><span class="focus-detail">${numberFormat.format(product.stock)} left · ${metrics.cover.toFixed(1)} days of cover</span></span>
        <button class="restock-inline" type="button" data-restock="${product.id}">Restock</button>
      </div>`).join('');
  }
  document.querySelector('#stock-summary').textContent = alerts.length ? `${getAlertProducts().length} items are under 7 days of expected demand.` : 'Every item has at least 7 days of expected demand.';
}

function statusText(status) {
  return status === 'low' ? 'Restock now' : status === 'watch' ? 'Watch stock' : 'On track';
}

function renderInventory() {
  const query = elements.search.value.trim().toLowerCase();
  const category = elements.category.value;
  const products = state.products.filter((product) => product.name.toLowerCase().includes(query) && (category === 'all' || product.category === category));
  if (!products.length) {
    elements.inventoryBody.innerHTML = '<tr><td class="table-empty" colspan="8">No products match this search.</td></tr>';
  } else {
    elements.inventoryBody.innerHTML = products.map((product) => {
      const metrics = getProductMetrics(product);
      const coverPercent = Math.min(100, metrics.cover / 14 * 100);
      const coverText = Number.isFinite(metrics.cover) ? `${metrics.cover.toFixed(1)} days` : 'No sales';
      return `<tr>
        <td><span class="table-product"><span class="product-icon ${iconClass(product.category)}" aria-hidden="true">${product.emoji}</span><span><strong>${product.name}</strong><small>${formatMoney(product.price)} / unit</small></span></span></td>
        <td class="category-label">${product.category}</td>
        <td><span class="stock-number">${numberFormat.format(product.stock)}</span> <span class="stock-unit">units</span></td>
        <td>${numberFormat.format(metrics.sold)} <span class="stock-unit">units</span></td>
        <td><span class="demand-number">${numberFormat.format(metrics.demand)}</span> <span class="stock-unit">units</span></td>
        <td><span class="cover-track"><span class="cover-fill${metrics.status === 'low' ? ' low' : ''}" style="display:block;width:${coverPercent}%"></span></span><span class="cover-label">${coverText}</span></td>
        <td><span class="status status-${metrics.status}">${statusText(metrics.status)}</span></td>
        <td><button class="row-action" type="button" data-restock="${product.id}" aria-label="Restock ${product.name}">Restock</button></td>
      </tr>`;
    }).join('');
  }
  document.querySelector('#product-count').textContent = `${products.length} product${products.length === 1 ? '' : 's'}`;
}

function renderActivity() {
  const transactions = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  if (!transactions.length) {
    elements.activityList.innerHTML = '<div class="empty-state">No sales recorded yet. Add your first sale to get started.</div>';
    return;
  }
  elements.activityList.innerHTML = transactions.map((transaction) => {
    const product = productById(transaction.productId);
    if (!product) return '';
    const date = new Date(transaction.date);
    const isToday = localDateKey(date) === localDateKey();
    return `<div class="activity-row">
      <span class="product-icon ${iconClass(product.category)}" aria-hidden="true">${product.emoji}</span>
      <span class="activity-copy"><strong>${product.name}</strong><small>${isToday ? 'Today' : formatDate(date)} · ${transaction.kind === 'restock' ? 'Stock replenished' : 'Sale recorded'}</small></span>
      <span class="activity-qty">${transaction.kind === 'restock' ? '+' : '−'}${transaction.units} units</span>
      <span class="activity-total">${transaction.kind === 'restock' ? 'Stock update' : formatMoney(transaction.units * product.price)}</span>
    </div>`;
  }).join('');
}

function populateCategories() {
  const selected = elements.category.value || 'all';
  const categories = [...new Set(state.products.map((product) => product.category))].sort();
  elements.category.innerHTML = '<option value="all">All categories</option>' + categories.map((item) => `<option value="${item}">${item}</option>`).join('');
  elements.category.value = categories.includes(selected) ? selected : 'all';
}

function populateProductSelect(selectedId) {
  elements.actionProduct.innerHTML = state.products.map((product) => `<option value="${product.id}">${product.name}</option>`).join('');
  if (selectedId && productById(selectedId)) elements.actionProduct.value = selectedId;
  updateProductContext();
}

function updateProductContext() {
  const product = productById(elements.actionProduct.value);
  if (!product) {
    elements.productContext.textContent = '';
    return;
  }
  elements.productContext.textContent = `${numberFormat.format(product.stock)} units on hand · ${formatMoney(product.price)} per unit`;
}

function openActionDialog(type, productId) {
  const isRestock = type === 'restock';
  elements.actionType.value = type;
  elements.dialogTitle.textContent = isRestock ? 'Restock inventory' : 'Record a sale';
  elements.dialogKicker.textContent = isRestock ? 'INVENTORY UPDATE' : 'SALES ACTIVITY';
  elements.dialogDescription.textContent = isRestock ? 'Add delivered units to update shelf quantities.' : 'Log items sold to update today’s sales and stock forecast.';
  elements.dialogSubmit.textContent = isRestock ? 'Add to stock' : 'Save sale';
  elements.actionQuantity.value = '1';
  elements.formError.textContent = '';
  populateProductSelect(productId);
  if (elements.dialog.showModal) elements.dialog.showModal();
  else elements.dialog.setAttribute('open', '');
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove('is-visible'), 2600);
}

function render() {
  persist();
  renderMetrics();
  renderChart();
  renderRestockList();
  renderInventory();
  renderActivity();
}

document.querySelector('#sale-open').addEventListener('click', () => openActionDialog('sale'));
document.querySelector('#activity-sale').addEventListener('click', () => openActionDialog('sale'));
document.querySelector('#restock-open').addEventListener('click', () => openActionDialog('restock'));
document.querySelector('#dialog-cancel').addEventListener('click', () => elements.dialog.close());
elements.actionProduct.addEventListener('change', updateProductContext);
elements.search.addEventListener('input', renderInventory);
elements.category.addEventListener('change', renderInventory);

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-restock]');
  if (button) openActionDialog('restock', button.dataset.restock);
  const navLink = event.target.closest('.nav-link');
  if (navLink) {
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('is-active', link === navLink));
  }
});

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const product = productById(elements.actionProduct.value);
  const quantity = Number(elements.actionQuantity.value);
  const kind = elements.actionType.value;
  if (!product || !Number.isInteger(quantity) || quantity < 1) {
    elements.formError.textContent = 'Enter a whole quantity greater than zero.';
    return;
  }
  if (kind === 'sale' && quantity > product.stock) {
    elements.formError.textContent = `Only ${product.stock} units are currently in stock.`;
    return;
  }
  product.stock += kind === 'restock' ? quantity : -quantity;
  if (kind === 'sale') product.dailySales[6] = (product.dailySales[6] || 0) + quantity;
  state.transactions.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, productId: product.id, units: quantity, date: new Date().toISOString(), kind });
  elements.dialog.close();
  render();
  showToast(kind === 'restock' ? `${quantity} units added to ${product.name}.` : `Sale recorded: ${quantity} × ${product.name}.`);
});

document.querySelector('#reset-demo').addEventListener('click', () => {
  state = makeInitialState();
  elements.search.value = '';
  elements.category.value = 'all';
  render();
  showToast('Demo data restored.');
});

renderDate();
populateCategories();
populateProductSelect();
render();
