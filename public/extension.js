// /public/extension.js

(function () {
  const themeScriptUrl = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
  const themeScriptTag = `<script src="${themeScriptUrl}"><\/script>`;

  const log = (...args) => console.log('🌓 ThemeSwitcher:', ...args);
  const error = (...args) => console.error('❌ ThemeSwitcher:', ...args);

  const initThemeSwitcher = () => {
    if (sessionStorage.getItem('theme-switcher-dismissed') === 'true') return;
    if (document.getElementById('theme-switcher-panel')) return;

    log('Initializing Theme Switcher panel...');

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
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
      max-width: 320px;
      line-height: 1.4;
    `;

    panel.innerHTML = `
      <h2 id="theme-switcher-heading" style="font-size:16px; margin-bottom:12px;">🌓 Theme Switcher</h2>
      <button id="add-script" style="margin-bottom:10px;width:100%;">➕ Add to This Page</button>
      <button id="copy-script" style="width:100%;">📋 Copy Script for Footer</button>
      <small style="display:block;margin-top:10px;font-size:11px;color:#ccc;">Paste in Site Settings > Custom Code for global use</small>
      <button id="dismiss-panel" style="margin-top:10px;width:100%;">❌ Close</button>
    `;

    document.body.appendChild(panel);
    log('Panel injected into page');

    const addBtn = document.getElementById('add-script');
    const copyBtn = document.getElementById('copy-script');
    const dismissBtn = document.getElementById('dismiss-panel');

    const scriptAlreadyExists = [...document.querySelectorAll('script')].some(s => s.src === themeScriptUrl);
    if (scriptAlreadyExists) {
      log('Script already present on page');
      addBtn.disabled = true;
      addBtn.textContent = '✅ Script already added';
      addBtn.style.backgroundColor = '#444';
      addBtn.style.cursor = 'default';
    }

    if (addBtn && !addBtn.disabled) {
      addBtn.onclick = async () => {
        log('➕ Add Script clicked');
        try {
          const extension = window.Webflow?.require?.('designer-extension');
          log('Extension:', extension);

          if (!extension) throw new Error('Designer extension not available');
          if (!extension.actions?.addEmbedBlock) throw new Error('addEmbedBlock not found on extension.actions');

          await extension.actions.addEmbedBlock({
            code: themeScriptTag,
            location: 'footer',
          });

          alert('✅ Script added to this page!');
          addBtn.disabled = true;
          addBtn.textContent = '✅ Script already added';
          addBtn.style.backgroundColor = '#444';
          addBtn.style.cursor = 'default';
        } catch (err) {
          error('Script injection failed:', err);
          alert(`⚠️ Failed to add script:\n${err.message}`);
        }
      };
    }

    if (copyBtn) {
      copyBtn.onclick = () => {
        log('📋 Copy Script clicked');
        const textarea = document.createElement('textarea');
        textarea.value = themeScriptTag;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          const success = document.execCommand('copy');
          alert(success
            ? '📋 Script copied! Paste into Site Settings > Footer.'
            : '⚠️ Copy failed. Try manually.');
        } catch (err) {
          error('Clipboard copy failed:', err);
          alert('⚠️ Copy failed. Try manually.');
        }
        document.body.removeChild(textarea);
      };
    }

    dismissBtn.onclick = () => {
      sessionStorage.setItem('theme-switcher-dismissed', 'true');
      panel.remove();
      log('Panel dismissed by user');
    };
  };

  const waitForDesignerAPI = () => {
    log('Waiting for Designer API...');
    const interval = setInterval(() => {
      const extension = window.Webflow?.require?.('designer-extension');
      if (extension) {
        clearInterval(interval);
        log('✅ Designer Extension API detected');
        initThemeSwitcher();
      }
    }, 300);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDesignerAPI);
  } else {
    waitForDesignerAPI();
  }
})();