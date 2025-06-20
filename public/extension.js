// /public/extension.js

// Detect if we're inside the Webflow Designer environment
const isInDesigner = window.location.href.includes('webflow.com/design');

if (!isInDesigner || !window.Webflow || !window.Webflow.require) {
  console.warn('🚫 Theme Switcher extension is not running inside Webflow Designer.');
  return;
}

function initThemeSwitcherExtension() {
  // Skip if user previously closed panel
  if (sessionStorage.getItem('theme-switcher-dismissed') === 'true') {
    console.log('🚫 Theme Switcher panel previously dismissed.');
    return;
  }

  console.log('🚀 Initializing Theme Switcher Extension...');

  const themeScript = '<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js"><\/script>';

  const panel = document.createElement('div');
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
    <button type="button" id="add-script" style="margin-bottom: 10px; width: 100%;" aria-label="Add Theme Switcher script to this Webflow page">➕ Add to This Page</button>
    <button type="button" id="copy-script" style="width: 100%;" aria-label="Copy Theme Switcher script for site footer">📋 Copy Script for Footer</button>
    <small style="display:block; margin-top: 10px; font-size: 11px; color: #ccc;">To apply globally, paste it in Site Settings > Custom Code</small>
    <button type="button" id="dismiss-panel" style="margin-top: 10px; width: 100%;" aria-label="Dismiss this panel">❌ Close</button>
  `;

  document.body.appendChild(panel);
  console.log('✅ Panel added');

  const addBtn = document.getElementById('add-script');
  const copyBtn = document.getElementById('copy-script');
  const dismissBtn = document.getElementById('dismiss-panel');

  // Handle Embed button
  if (addBtn) {
    addBtn.onclick = async () => {
      console.log('➕ Add Script clicked');
      try {
        const extension = window.Webflow?.require?.('designer-extension');
        if (extension?.actions?.addEmbedBlock) {
          await extension.actions.addEmbedBlock({
            code: themeScript,
            location: 'footer',
          });
          alert('✅ Script added to this page!');
        } else {
          alert('❌ Designer Extension API not available.');
          console.warn('❌ addEmbedBlock not found in designer-extension');
        }
      } catch (err) {
        console.error('⚠️ Script injection failed:', err);
        alert('⚠️ Failed to add script. Try again or use Copy Script.');
      }
    };
  }

  // Handle Copy button with fallback method
  if (copyBtn) {
    copyBtn.onclick = () => {
      console.log('📋 Copy Script clicked');
      const textarea = document.createElement('textarea');
      textarea.value = themeScript;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);

      textarea.select();
      try {
        const success = document.execCommand('copy');
        if (success) {
          alert('📋 Script copied! Paste it into Site Settings > Footer.');
        } else {
          throw new Error('Copy command was unsuccessful');
        }
      } catch (err) {
        console.error('❌ Copy fallback error:', err);
        alert('⚠️ Failed to copy script. Try manually.');
      }
      document.body.removeChild(textarea);
    };
  }

  // Handle Dismiss button
  if (dismissBtn) {
    dismissBtn.onclick = () => {
      sessionStorage.setItem('theme-switcher-dismissed', 'true');
      panel.remove();
      console.log('❌ Panel dismissed by user');
    };
  }
}

// Wait for Webflow Designer API
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