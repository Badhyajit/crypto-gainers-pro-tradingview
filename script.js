const apiBase = "https://fapi.binance.com";
document.getElementById("analyzeBtn").addEventListener("click", analyze);

async function analyze() {
  const symbol = document.getElementById("symbolInput").value.toUpperCase().trim();
  const interval = document.getElementById("timeframe").value;
  const resultDiv = document.getElementById("result");
  if (!symbol) {
    resultDiv.innerHTML = "Please enter a symbol (e.g. BTCUSDT)";
    return;
  }

  resultDiv.innerHTML = "Loading data...";

  try {
    const res = await fetch(`${apiBase}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=500`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid response");

    const closes = data.map(d => parseFloat(d[4]));
    const latestClose = closes[closes.length - 1];

    // RSI and MA Calculation
    const rsi20 = calcRSI(closes, 20);
    const rsi50 = calcRSI(closes, 50);
    const rsi150 = calcRSI(closes, 150);

    const ma9 = calcMA(closes, 9);
    const ma20 = calcMA(closes, 20);
    const ma50 = calcMA(closes, 50);

    // Signal Logic
    let buySignal = false;
    let sellSignal = false;

    if (rsi20 < 30 && latestClose > ma20) buySignal = true;
    if (rsi20 > 70 && latestClose < ma20) sellSignal = true;

    let buyClass = buySignal ? "buy" : "hold";
    let sellClass = sellSignal ? "sell" : "hold";

    resultDiv.innerHTML = `
      <h3>Symbol: ${symbol}</h3>
      <p><b>RSI (20/50/150):</b> ${rsi20.toFixed(2)} / ${rsi50.toFixed(2)} / ${rsi150.toFixed(2)}</p>
      <p><b>MA (9/20/50):</b> ${ma9.toFixed(2)} / ${ma20.toFixed(2)} / ${ma50.toFixed(2)}</p>
      <p><b>Market Price:</b> ${latestClose}</p>
      <p>Buy Signal: <span class="${buyClass}">${buySignal ? "Active 🟢" : "—"}</span></p>
      <p>Sell Signal: <span class="${sellClass}">${sellSignal ? "Active 🔴" : "—"}</span></p>
    `;
  } catch (e) {
    resultDiv.innerHTML = "⚠️ Error fetching data. Check symbol and try again.";
  }
}

// Moving Average
function calcMA(values, period) {
  if (values.length < period) return 0;
  const subset = values.slice(-period);
  return subset.reduce((a, b) => a + b, 0) / period;
}

// RSI Calculation
function calcRSI(values, period) {
  if (values.length < period) return 0;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length - 1; i++) {
    const diff = values[i + 1] - values[i];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Auto refresh every 1 second
setInterval(() => {
  const btn = document.getElementById("analyzeBtn");
  btn.click();
}, 1000);
