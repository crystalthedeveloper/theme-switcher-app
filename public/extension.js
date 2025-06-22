// /public/extension.js

(function () {
  const THEME_SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
  const THEME_SCRIPT_TAG = `<script src="${THEME_SCRIPT_URL}" defer></script>`;

  const log = (...args) => console.log('🌓 ThemeSwitcher:', ...args);
  const error = (...args) => console.error('❌ ThemeSwitcher:', ...args);

  function injectPanel() {
    if (sessionStorage.getItem('theme-switcher-dismissed') === 'true') return;
    if (document.getElementById('theme-switcher-panel')) return;

    log('Injecting control panel...');

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
      <h2 id="theme-switcher-heading" style="font-size:16px; margin-bottom:12px;">🌓 Theme Switcher</h2>

      <button id="add-embed-button" style="margin-bottom:10px;width:100%;padding:8px;font-size:14px;">➕ Add to This Page</button>
      <button id="copy-script" style="width:100%;padding:8px;font-size:14px;">📋 Copy Script for Footer</button>

      <div style="background:#111; padding:12px; border-radius:8px; margin-top:12px; color:#00ff88; font-size:13px;">
        ✅ <strong>Installed!</strong><br />
        Use this panel while inside the Webflow Designer to add the script.<br /><br />
        If nothing happens when clicking "Add to This Page", try:
        <ul style="margin:6px 0 0 1rem; padding:0; color:#ccc; font-size:12px;">
          <li>Click once in the canvas</li>
          <li>Wait a second after loading</li>
          <li>Check console for permission errors</li>
        </ul>
      </div>

      <button id="dismiss-panel" style="margin-top:12px;width:100%;padding:6px;font-size:13px;">❌ Close</button>
    `;

    document.body.appendChild(panel);
    log('Panel rendered.');

    const addBtn = panel.querySelector('#add-embed-button');
    const copyBtn = panel.querySelector('#copy-script');
    const dismissBtn = panel.querySelector('#dismiss-panel');

    const scriptAlreadyExists = [...document.scripts].some(s => s.src === THEME_SCRIPT_URL);
    if (scriptAlreadyExists) {
      addBtn.disabled = true;
      addBtn.textContent = '✅ Script already added';
      addBtn.style.backgroundColor = '#444';
      addBtn.style.cursor = 'default';
    }

    addBtn.addEventListener('click', async () => {
      try {
        const extension =
          window.Webflow?.require?.('designer-extension') ||
          window.Webflow?.EditorExtension;

        if (!extension) throw new Error('🛑 Webflow Extension API not found');

        const addEmbed = extension.actions?.addEmbedBlock || extension.addEmbed;
        if (!addEmbed) {
          throw new Error('⚠️ Embed function missing — check your permissions (custom_code:write)');
        }

        await addEmbed({
          code: THEME_SCRIPT_TAG,
          location: 'footer'
        });

        alert('✅ Script added!');
        addBtn.disabled = true;
        addBtn.textContent = '✅ Script already added';
        addBtn.style.backgroundColor = '#444';
        addBtn.style.cursor = 'default';
      } catch (err) {
        error('Embed injection failed:', err);
        alert(`⚠️ Failed to add script:\n${err.message}`);
      }
    });

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(THEME_SCRIPT_TAG).then(() => {
        alert('📋 Script copied! Paste into Site Settings > Footer.');
      }).catch(err => {
        error('Clipboard error:', err);
        alert('⚠️ Couldn’t copy automatically. Try manually.');
      });
    });

    dismissBtn.addEventListener('click', () => {
      sessionStorage.setItem('theme-switcher-dismissed', 'true');
      panel.remove();
      log('Panel dismissed.');
    });
  }

  function waitForWebflowAPI() {
    log('⏳ Waiting for Webflow Designer API...');
    const checkInterval = setInterval(() => {
      const extension =
        window.Webflow?.require?.('designer-extension') ||
        window.Webflow?.EditorExtension;

      if (extension) {
        clearInterval(checkInterval);
        log('✅ Webflow Designer API available');
        injectPanel();
      }
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForWebflowAPI);
  } else {
    waitForWebflowAPI();
  }
})();