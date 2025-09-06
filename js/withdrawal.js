(function () {
  const MIN_WITHDRAW = 0.00011;
  const STORAGE_KEY = 'ct_withdraw_btc_address';

  const noAddressState    = document.getElementById('noAddressState');
  const hasAddressState   = document.getElementById('hasAddressState');
  const savedAddressText  = document.getElementById('savedAddressText');
  const clearAddressBtn   = document.getElementById('clearAddressBtn');
  const openModalBtn      = document.getElementById('openAddressModalBtn');
  const addressModal      = document.getElementById('addressModal');
  const closeModalBtn     = document.getElementById('closeModalBtn');
  const btcAddressInput   = document.getElementById('btcAddressInput');
  const confirmAddressBtn = document.getElementById('confirmAddressBtn');
  const amountInput       = document.getElementById('withdrawAmount');
  const amountWrap        = document.getElementById('amountWrap');
  const amountError       = document.getElementById('amountError');
  const withdrawBtn       = document.getElementById('withdrawBtn');
  const maxBtn            = document.getElementById('maxBtn');
  const walletSelect      = document.getElementById('walletSelect');

  function getBalance() {
    return (typeof window.MINING_BALANCE_BTC !== 'undefined')
      ? Number(window.MINING_BALANCE_BTC)
      : 0.000001;
  }

  // ---------- Address Persistence ----------
  function loadAddress() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function saveAddress(addr) {
    localStorage.setItem(STORAGE_KEY, addr);
  }

  function clearAddress() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function showHasAddress(addr) {
    savedAddressText.textContent = addr;
    noAddressState.classList.add('hidden');
    hasAddressState.classList.remove('hidden');
    validateAmount();
  }

  function showNoAddress() {
    noAddressState.classList.remove('hidden');
    hasAddressState.classList.add('hidden');
  }

  // Init
  const saved = loadAddress();
  if (saved) {
    showHasAddress(saved);
  } else {
    showNoAddress();
  }

  // Open modal
  openModalBtn.addEventListener('click', () => {
    btcAddressInput.value = '';
    addressModal.classList.add('show');
    setTimeout(() => btcAddressInput.focus(), 280);
  });

  walletSelect.addEventListener('change', () => {
    if (walletSelect.value === 'external') {
      openModalBtn.click();
      walletSelect.value = '';
    }
  });

  // Close modal
  closeModalBtn.addEventListener('click', () => {
    addressModal.classList.remove('show');
  });

  addressModal.addEventListener('click', (e) => {
    if (e.target === addressModal) {
      addressModal.classList.remove('show');
    }
  });

  // Confirm address
  confirmAddressBtn.addEventListener('click', () => {
    const addr = btcAddressInput.value.trim();
    if (!addr || addr.length < 20) {
      alert('Please enter a valid Bitcoin address');
      return;
    }
    saveAddress(addr);
    showHasAddress(addr);
    addressModal.classList.remove('show');
  });

  // Clear address (only when user clicks ×)
  clearAddressBtn.addEventListener('click', () => {
    if (confirm('Remove saved Bitcoin address?')) {
      clearAddress();
      showNoAddress();
    }
  });

  // ---------- MAX button ----------
  maxBtn.addEventListener('click', () => {
    const balance = getBalance();
    amountInput.value = balance;
    validateAmount();
  });

  // ---------- Amount validation ----------
  function validateAmount() {
    const balance = getBalance();
    const val = parseFloat(amountInput.value) || 0;

    amountError.textContent = '';
    amountWrap.classList.remove('error');
    withdrawBtn.disabled = true;

    if (balance < MIN_WITHDRAW) {
      amountError.textContent = `Your balance (${balance} BTC) is below the minimum of ${MIN_WITHDRAW} BTC`;
      amountWrap.classList.add('error');
      return;
    }

    if (!amountInput.value) return;

    if (val < MIN_WITHDRAW) {
      amountError.textContent = `Enter more than ${MIN_WITHDRAW} BTC`;
      amountWrap.classList.add('error');
      return;
    }

    if (val > balance) {
      amountError.textContent = `Amount exceeds your balance of ${balance} BTC`;
      amountWrap.classList.add('error');
      return;
    }

    withdrawBtn.disabled = false;
  }

  amountInput.addEventListener('input', validateAmount);

  // Withdraw button (demo)
  withdrawBtn.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    const addr = loadAddress();
    alert(`Withdrawal of ${amount} BTC to\n${addr}\n\n(want to continue?)`);
  });
})();