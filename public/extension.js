// /public/extension.js

// Detect if we're inside the Webflow Designer environment
const isInDesigner = window.location.href.includes('webflow.com/design');

if (!isInDesigner || !window.Webflow || !window.Webflow.require) {
  console.warn('🚫 Theme Switcher extension is not running inside Webflow Designer.');
  return;
}

function initThemeSwitcherExtension() {
  // Check if user has previously dismissed the panel
  if (sessionStorage.getItem('theme-switcher-dismissed') === 'true') {
    console.log('🚫 Panel was dismissed earlier. Skipping display.');
    return;
  }

  console.log('🚀 Initializing Theme Switcher Extension...');

  const themeScript = '<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js"><\/script>';

  const panel = document.createElement('div');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'theme-switcher-heading');
  panel.setAttribute('aria-modal', 'true');
  panel.style.position = 'fixed';
  panel.style.bottom = '20px';
  panel.style.right = '20px';
  panel.style.background = '#1a1a1a';
  panel.style.color = '#fff';
  panel.style.padding = '16px';
  panel.style.borderRadius = '8px';
  panel.style.zIndex = 999999;
  panel.style.fontFamily = 'sans-serif';
  panel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.4)';
  panel.style.maxWidth = '320px';
  panel.style.lineHeight = '1.4';
  panel.innerHTML = `
    <h2 id="theme-switcher-heading" style="font-size:16px; margin-bottom: 12px;">🌓 Theme Switcher</h2>
    <button type="button" id="add-script" style="margin-bottom: 10px; width: 100%;" aria-label="Add Theme Switcher script to this Webflow page">➕ Add to This Page</button>
    <button type="button" id="copy-script" style="width: 100%;" aria-label="Copy Theme Switcher script for site footer">📋 Copy Script for Footer</button>
    <small style="display:block; margin-top: 10px; font-size: 11px; color: #ccc;">To apply globally, paste it in Site Settings > Custom Code</small>
    <button type="button" id="dismiss-panel" style="margin-top: 10px; width: 100%;" aria-label="Dismiss this panel">❌ Close</button>
  `;

  document.body.appendChild(panel);
  console.log('✅ Panel injected into the DOM');

  const addBtn = document.getElementById('add-script');
  const copyBtn = document.getElementById('copy-script');
  const dismissBtn = document.getElementById('dismiss-panel');

  if (addBtn) {
    console.log('🔗 Binding Add button...');
    addBtn.onclick = async () => {
      console.log('➕ Add Script button clicked');
      try {
        const extension = window.Webflow?.require?.('designer-extension');
        if (extension?.actions?.addEmbedBlock) {
          console.log('🧩 addEmbedBlock API found');
          await extension.actions.addEmbedBlock({
            code: themeScript,
            location: 'footer',
          });
          alert('✅ Script added to the current page.');
        } else {
          console.warn('❌ addEmbedBlock not available in designer-extension');
          alert('❌ Designer Extension API not available.');
        }
      } catch (err) {
        console.error('⚠️ Error injecting script:', err);
        alert('⚠️ Failed to inject script. Try again or use Copy Script.');
      }
    };
  }

  if (copyBtn) {
    console.log('🔗 Binding Copy button...');
    copyBtn.onclick = () => {
      console.log('📋 Copy Script button clicked');
      navigator.clipboard.writeText(themeScript)
        .then(() => alert('📋 Script copied! Paste into Site Settings > Footer.'))
        .catch(err => console.error('❌ Clipboard copy failed:', err));
    };
  }

  if (dismissBtn) {
    console.log('🔗 Binding Dismiss button...');
    dismissBtn.onclick = () => {
      console.log('❌ Dismissing Theme Switcher panel');
      sessionStorage.setItem('theme-switcher-dismissed', 'true');
      panel.remove();
    };
  }
}

// Safe run when DOM is ready and Designer Extension API is available
const runOnReady = () => {
  console.log('📦 DOM ready. Waiting for Designer Extension API...');
  const interval = setInterval(() => {
    const designerApi = window.Webflow?.require?.('designer-extension');
    if (designerApi) {
      clearInterval(interval);
      console.log('✅ Designer Extension API available');
      initThemeSwitcherExtension();
    }
  }, 300);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runOnReady);
} else {
  runOnReady();
}