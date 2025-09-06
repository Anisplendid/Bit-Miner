(function () {
  // ========== SUPPORT PAGE ==========
  const sendBtn = document.getElementById('sendSupportBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const subject = document.getElementById('supportSubject').value;
      const message = document.getElementById('supportMessage').value.trim();

      if (!subject) {
        alert('Please select a subject');
        return;
      }
      if (!message || message.length < 10) {
        alert('Please write a longer message');
        return;
      }

      // Save ticket
      const tickets = JSON.parse(localStorage.getItem('ct_support_tickets') || '[]');
      tickets.push({
        subject,
        email: document.getElementById('supportEmail').value,
        message,
        date: new Date().toISOString()
      });
      localStorage.setItem('ct_support_tickets', JSON.stringify(tickets));

      // Redirect to success page
      window.location.href = 'support-success.html';
    });
  }

  // ========== SECURITY SETTINGS (Persistent) ==========
  const SECURITY_KEY = 'ct_security_settings';

  const defaultSettings = {
    twoFA: false,
    loginAlert: true,
    antiPhish: false,
    whitelist: false,
    timeout: '30'
  };

  function loadSettings() {
    try {
      return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SECURITY_KEY) || '{}') };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SECURITY_KEY, JSON.stringify(settings));
  }

  // Only run on security page
  const sec2FA = document.getElementById('sec2FA');
  if (sec2FA) {
    const settings = loadSettings();

    // Apply saved values
    document.getElementById('sec2FA').checked = settings.twoFA;
    document.getElementById('secLoginAlert').checked = settings.loginAlert;
    document.getElementById('secAntiPhish').checked = settings.antiPhish;
    document.getElementById('secWhitelist').checked = settings.whitelist;
    document.getElementById('secTimeout').value = settings.timeout;

    // Save on change
    function update(key, value) {
      const s = loadSettings();
      s[key] = value;
      saveSettings(s);
    }

    document.getElementById('sec2FA').addEventListener('change', (e) => update('twoFA', e.target.checked));
    document.getElementById('secLoginAlert').addEventListener('change', (e) => update('loginAlert', e.target.checked));
    document.getElementById('secAntiPhish').addEventListener('change', (e) => update('antiPhish', e.target.checked));
    document.getElementById('secWhitelist').addEventListener('change', (e) => update('whitelist', e.target.checked));
    document.getElementById('secTimeout').addEventListener('change', (e) => update('timeout', e.target.value));
  }
})();