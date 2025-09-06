// BitMiner - Live BTC Price + Chart Engine
(function () {
  // Use central balance from script.js if available, otherwise fallback
  const BTC_BALANCE = (typeof window.MINING_BALANCE_BTC !== 'undefined')
    ? window.MINING_BALANCE_BTC
    : 0.000001;

  let currentPrice = 79673.35;
  let change24h = -1.6;
  let priceHistory = [];
  const MAX_POINTS = 40;

  // Seed initial history with slight variation
  function seedHistory(base) {
    priceHistory = [];
    let p = base * 0.992;
    for (let i = 0; i < MAX_POINTS; i++) {
      p += (Math.random() - 0.48) * base * 0.0015;
      priceHistory.push(p);
    }
    priceHistory[priceHistory.length - 1] = base;
  }

  function formatPrice(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatUSD(btc, price) {
    const usd = btc * price;
    return '~ $' + usd.toFixed(2);
  }

  function formatBTC(btc) {
    // show full precision for small balances
    return btc.toFixed(8).replace(/\.?0+$/, '') || '0';
  }

  function updateUI() {
    // Price displays
    document.querySelectorAll('[data-btc-price]').forEach(el => {
      el.textContent = formatPrice(currentPrice);
    });

    // 24h change
    document.querySelectorAll('[data-btc-change]').forEach(el => {
      const up = change24h >= 0;
      el.textContent = (up ? '↑ ' : '↓ ') + Math.abs(change24h).toFixed(2) + '% 24H';
      el.className = 'change ' + (up ? 'up' : 'down');
    });

    // USD balance values (market moves affect this)
    document.querySelectorAll('[data-btc-usd]').forEach(el => {
      const prefix = el.dataset.prefix || '';
      el.textContent = prefix + formatUSD(BTC_BALANCE, currentPrice);
    });

    // Raw BTC amount displays – all controlled from one place
    document.querySelectorAll('[data-btc-amount]').forEach(el => {
      const suffix = el.dataset.suffix || '';
      el.textContent = formatBTC(BTC_BALANCE) + suffix;
    });

    // Redraw charts
    document.querySelectorAll('.chart-container').forEach(container => {
      drawChart(container);
    });
  }

  function drawChart(container) {
    if (!priceHistory.length) return;
    let svg = container.querySelector('svg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 300 120');
      svg.setAttribute('preserveAspectRatio', 'none');
      container.appendChild(svg);
    }

    const w = 300, h = 120;
    const min = Math.min(...priceHistory);
    const max = Math.max(...priceHistory);
    const range = max - min || 1;
    const pad = 8;

    const points = priceHistory.map((p, i) => {
      const x = (i / (priceHistory.length - 1)) * w;
      const y = h - pad - ((p - min) / range) * (h - pad * 2);
      return [x, y];
    });

    // Area path
    let area = `M0,${h} `;
    points.forEach(([x, y]) => { area += `L${x},${y} `; });
    area += `L${w},${h} Z`;

    // Line path
    let line = `M${points[0][0]},${points[0][1]} `;
    for (let i = 1; i < points.length; i++) {
      line += `L${points[i][0]},${points[i][1]} `;
    }

    svg.innerHTML = `
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#chartGrad)"/>
      <path d="${line}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  }

  async function fetchPrice() {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.bitcoin && data.bitcoin.usd) {
        currentPrice = data.bitcoin.usd;
        change24h = data.bitcoin.usd_24h_change || change24h;
        // push new point
        priceHistory.push(currentPrice);
        if (priceHistory.length > MAX_POINTS) priceHistory.shift();
        updateUI();
      }
    } catch (e) {
      // fallback: small random walk so chart still moves
      const delta = (Math.random() - 0.5) * currentPrice * 0.0012;
      currentPrice = Math.max(1000, currentPrice + delta);
      priceHistory.push(currentPrice);
      if (priceHistory.length > MAX_POINTS) priceHistory.shift();
      updateUI();
    }
  }

  // Init
  seedHistory(currentPrice);
  updateUI();

  // Live updates every 8 seconds
  setInterval(fetchPrice, 8000);
  // First real fetch soon
  setTimeout(fetchPrice, 1200);

  // Expose for manual refresh if needed
  window.CTPool = { refresh: fetchPrice, getPrice: () => currentPrice };
})();
