// /public/extension.js

(function () {
  const themeScriptUrl = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
  const themeScriptTag = `<script src="${themeScriptUrl}"><\/script>`;
  const isInDesigner = window.location.href.includes('webflow.com/design');

  if (!isInDesigner || !window.Webflow || !window.Webflow.require) {
    console.warn('🚫 Theme Switcher extension is not running inside Webflow Designer.');
    return;
  }

  const initThemeSwitcherExtension = () => {
    if (sessionStorage.getItem('theme-switcher-dismissed') === 'true') {
      console.log('🚫 Theme Switcher panel previously dismissed.');
      return;
    }

    if (document.getElementById('theme-switcher-panel')) {
      console.log('⚠️ Panel already exists.');
      return;
    }

    console.log('🚀 Initializing Theme Switcher Extension...');

    const scriptAlreadyExists = [...document.querySelectorAll('script')].some(
      (s) => s.src === themeScriptUrl
    );

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
      <h2 id="theme-switcher-heading" style="font-size:16px; margin-bottom: 12px;">🌓 Theme Switcher</h2>
      <button type="button" id="add-script" style="margin-bottom: 10px; width: 100%;">➕ Add to This Page</button>
      <button type="button" id="copy-script" style="width: 100%;">📋 Copy Script for Footer</button>
      <small style="display:block; margin-top: 10px; font-size: 11px; color: #ccc;">To apply globally, paste it in Site Settings > Custom Code</small>
      <button type="button" id="dismiss-panel" style="margin-top: 10px; width: 100%;">❌ Close</button>
    `;

    document.body.appendChild(panel);
    console.log('✅ Panel added');

    const addBtn = document.getElementById('add-script');
    const copyBtn = document.getElementById('copy-script');
    const dismissBtn = document.getElementById('dismiss-panel');

    if (scriptAlreadyExists) {
      addBtn.disabled = true;
      addBtn.textContent = '✅ Script already added';
      addBtn.style.backgroundColor = '#444';
      addBtn.style.cursor = 'default';
    }

    if (addBtn && !addBtn.disabled) {
      addBtn.onclick = async () => {
        console.log('➕ Add Script clicked');
        try {
          const extension = window.Webflow?.require?.('designer-extension');
          if (extension?.actions?.addEmbedBlock) {
            await extension.actions.addEmbedBlock({
              code: themeScriptTag,
              location: 'footer',
            });
            alert('✅ Script added to this page!');
            addBtn.disabled = true;
            addBtn.textContent = '✅ Script already added';
            addBtn.style.backgroundColor = '#444';
            addBtn.style.cursor = 'default';
          } else {
            alert('❌ Designer Extension API not available.');
            console.warn('❌ addEmbedBlock not found');
          }
        } catch (err) {
          console.error('⚠️ Script injection failed:', err);
          alert('⚠️ Failed to add script. Try again or use Copy Script.');
        }
      };
    }

    if (copyBtn) {
      copyBtn.onclick = () => {
        console.log('📋 Copy Script clicked');
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
            ? '📋 Script copied! Paste it into Site Settings > Footer.'
            : '⚠️ Copy failed. Try manually.');
        } catch (err) {
          console.error('❌ Clipboard copy failed:', err);
          alert('⚠️ Failed to copy script. Try manually.');
        }
        document.body.removeChild(textarea);
      };
    }

    if (dismissBtn) {
      dismissBtn.onclick = () => {
        sessionStorage.setItem('theme-switcher-dismissed', 'true');
        panel.remove();
        console.log('❌ Panel dismissed by user');
      };
    }
  };

  const waitForDesignerAPI = () => {
    const interval = setInterval(() => {
      const extension = window.Webflow?.require?.('designer-extension');
      if (extension) {
        clearInterval(interval);
        console.log('✅ Designer Extension API available');
        initThemeSwitcherExtension();
      }
    }, 300);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDesignerAPI);
  } else {
    waitForDesignerAPI();
  }
})();