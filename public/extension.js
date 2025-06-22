// /public/extension.js

(function () {
  const THEME_SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
  const THEME_SCRIPT_TAG = `<script src="${THEME_SCRIPT_URL}"><\/script>`;

  const log = (...args) => console.log('🌓 ThemeSwitcher:', ...args);
  const error = (...args) => console.error('❌ ThemeSwitcher:', ...args);

  function initThemeSwitcher() {
    if (sessionStorage.getItem('theme-switcher-dismissed') === 'true') return;
    if (document.getElementById('theme-switcher-panel')) return;

    log('Injecting panel...');
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
    log('Panel ready.');

    const addBtn = panel.querySelector('#add-script');
    const copyBtn = panel.querySelector('#copy-script');
    const dismissBtn = panel.querySelector('#dismiss-panel');

    const scriptExists = [...document.querySelectorAll('script')].some(s => s.src === THEME_SCRIPT_URL);
    if (scriptExists) {
      addBtn.disabled = true;
      addBtn.textContent = '✅ Script already added';
      addBtn.style.backgroundColor = '#444';
      addBtn.style.cursor = 'default';
    }

    if (!addBtn.disabled) {
      addBtn.onclick = async () => {
        try {
          const extension =
            window.Webflow?.require?.('designer-extension') ||
            window.Webflow?.EditorExtension;

          if (!extension) throw new Error('Extension API not found.');
          log('✅ Webflow Extension object:', extension);

          if (!extension.actions) throw new Error('Extension.actions is missing.');
          log('✅ Extension.actions object found:', extension.actions);

          if (!extension.actions.addEmbedBlock) {
            throw new Error('❌ addEmbedBlock is undefined. You might be missing "custom_code:write" permission or not in a valid page context.');
          }

          log('➡️ Attempting to inject script via addEmbedBlock...');
          await extension.actions.addEmbedBlock({
            code: THEME_SCRIPT_TAG,
            location: 'footer',
          });

          alert('✅ Script added to this page!');
          addBtn.disabled = true;
          addBtn.textContent = '✅ Script already added';
          addBtn.style.backgroundColor = '#444';
          addBtn.style.cursor = 'default';
        } catch (err) {
          error('🚫 Failed to add embed:', err);
          alert(`⚠️ Failed to add embed:\n${err.message}`);
        }
      };
    }

    copyBtn.onclick = () => {
      const textarea = document.createElement('textarea');
      textarea.value = THEME_SCRIPT_TAG;
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
        error('Copy failed:', err);
        alert('⚠️ Copy failed. Try manually.');
      }
      document.body.removeChild(textarea);
    };

    dismissBtn.onclick = () => {
      sessionStorage.setItem('theme-switcher-dismissed', 'true');
      panel.remove();
      log('Panel dismissed');
    };
  }

  function waitForDesignerAPI() {
    log('⌛ Waiting for Designer Extension API...');
    const interval = setInterval(() => {
      const extension =
        window.Webflow?.require?.('designer-extension') ||
        window.Webflow?.EditorExtension;

      if (extension) {
        clearInterval(interval);
        log('✅ Designer Extension API loaded.');
        initThemeSwitcher();
      }
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDesignerAPI);
  } else {
    waitForDesignerAPI();
  }
})();