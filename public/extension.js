// /public/extension.js

(function () {
  const THEME_SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
  const THEME_SCRIPT_TAG = `<script src="${THEME_SCRIPT_URL}"><\/script>`;

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
      max-width: 320px;
      line-height: 1.4;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
    `;

    panel.innerHTML = `
      <h2 id="theme-switcher-heading" style="font-size:16px; margin-bottom:12px;">🌓 Theme Switcher</h2>
      <button id="add-script" style="margin-bottom:10px;width:100%;">➕ Add to This Page</button>
      <button id="copy-script" style="width:100%;">📋 Copy Script for Footer</button>
      <small style="display:block;margin-top:10px;font-size:11px;color:#ccc;">
        Paste in Site Settings > Custom Code for global use
      </small>
      <button id="dismiss-panel" style="margin-top:10px;width:100%;">❌ Close</button>
    `;

    document.body.appendChild(panel);
    log('Panel rendered.');

    const addBtn = panel.querySelector('#add-script');
    const copyBtn = panel.querySelector('#copy-script');
    const dismissBtn = panel.querySelector('#dismiss-panel');

    // Disable Add button if script is already present
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

        if (!extension) throw new Error('🛑 Webflow Extension API not found.');

        log('✅ Extension loaded:', extension);

        if (!extension.actions?.addEmbedBlock) {
          throw new Error('⚠️ `addEmbedBlock` is missing — check `custom_code:write` permission or context.');
        }

        await extension.actions.addEmbedBlock({
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
        alert(`⚠️ Script injection failed:\n${err.message}`);
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
      log('Panel closed by user.');
    });
  }

  function waitForWebflowAPI() {
    log('⏳ Waiting for Webflow Designer Extension API...');

    const checkInterval = setInterval(() => {
      const extension =
        window.Webflow?.require?.('designer-extension') ||
        window.Webflow?.EditorExtension;

      if (extension) {
        clearInterval(checkInterval);
        log('✅ Webflow Designer API ready.');
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