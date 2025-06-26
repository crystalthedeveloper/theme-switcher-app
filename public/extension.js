// /public/extension.js

(function () {
  const SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
  const SCRIPT_TAG = `<script src="${SCRIPT_URL}" defer></script>`;

  const log = (...args) => console.log('🌓 ThemeSwitcher:', ...args);
  const error = (...args) => console.error('❌ ThemeSwitcher:', ...args);

  function injectPanel() {
    if (sessionStorage.getItem('theme-switcher-dismissed') === 'true') return;
    if (document.getElementById('theme-switcher-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'theme-switcher-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'theme-switcher-heading');
    panel.setAttribute('aria-modal', 'true');
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1a1a1a;
      color: #fff;
      padding: 16px;
      border-radius: 8px;
      z-index: 999999;
      font-family: sans-serif;
      max-width: 340px;
      line-height: 1.5;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
    `;

    panel.innerHTML = `
      <h2 id="theme-switcher-heading" style="font-size:16px;margin-bottom:12px;">🌓 Theme Switcher</h2>
      <button id="copy-script" style="width:100%;padding:8px;font-size:14px;">📋 Copy Script Tag</button>
      <div style="background:#111;padding:12px;border-radius:8px;margin-top:12px;color:#00ff88;font-size:13px;">
        ✅ <strong>Installed!</strong><br />
        If automatic injection didn’t work, you can add this manually.<br /><br />
        <strong>Paste this script into:</strong><br />
        <ul style="margin:6px 0 0 1rem;padding:0;color:#ccc;font-size:12px;">
          <li>Site Settings → Custom Code → Footer</li>
          <li>OR Page Settings → Footer</li>
        </ul>
      </div>
      <button id="dismiss-panel" style="margin-top:12px;width:100%;padding:6px;font-size:13px;">❌ Close</button>
    `;

    document.body.appendChild(panel);
    log('Panel rendered.');

    panel.querySelector('#copy-script').addEventListener('click', () => {
      navigator.clipboard.writeText(SCRIPT_TAG)
        .then(() => alert('📋 Script copied! Paste it into Webflow Footer settings if needed.'))
        .catch(err => {
          error('Clipboard error:', err);
          alert('⚠️ Couldn’t copy automatically. Try manually.');
        });
    });

    panel.querySelector('#dismiss-panel').addEventListener('click', () => {
      sessionStorage.setItem('theme-switcher-dismissed', 'true');
      panel.remove();
      log('Panel dismissed.');
    });
  }

  function waitForWebflowAPI() {
    log('⏳ Waiting for Webflow Designer API...');
    const interval = setInterval(() => {
      const extension =
        window.Webflow?.require?.('designer-extension') ||
        window.Webflow?.EditorExtension;

      if (extension) {
        clearInterval(interval);
        log('✅ Designer API available');
        injectPanel();
      }
    }, 400);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', waitForWebflowAPI)
    : waitForWebflowAPI();
})();