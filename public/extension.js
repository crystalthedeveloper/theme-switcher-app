// /public/extension.js

// Prevent script from running outside the Webflow Designer
if (!window.Webflow || !window.Webflow.require || !window.Webflow.require('ix2')) {
  console.warn('🚫 Theme Switcher extension is not running inside Webflow Designer.');
  return;
}

function initThemeSwitcherExtension() {
  console.log('🚀 Initializing Theme Switcher Extension...');

  const themeScript = '<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js"><\/script>';

  const panel = document.createElement('div');
  panel.setAttribute('role', 'region');
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
  panel.innerHTML = `
    <strong style="display:block; margin-bottom: 12px;">🌓 Theme Switcher</strong>
    <button id="add-script" style="margin-bottom: 10px; width: 100%;" aria-label="Add Theme Switcher script to this Webflow page">➕ Add to This Page</button>
    <button id="copy-script" style="width: 100%;" aria-label="Copy Theme Switcher script for site footer">📋 Copy Script for Footer</button>
    <small style="display:block; margin-top: 10px; font-size: 11px; color: #ccc;">To apply globally, paste it in Site Settings > Custom Code</small>
    <button id="dismiss-panel" style="margin-top: 10px; width: 100%;">❌ Close</button>
  `;

  document.body.appendChild(panel);
  console.log('✅ Panel injected into the DOM');

  const addBtn = document.getElementById('add-script');
  const copyBtn = document.getElementById('copy-script');

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
  } else {
    console.warn('⚠️ Add button not found in DOM');
  }

  if (copyBtn) {
    console.log('🔗 Binding Copy button...');
    copyBtn.onclick = () => {
      console.log('📋 Copy Script button clicked');
      navigator.clipboard.writeText(themeScript)
        .then(() => {
          alert('📋 Script copied! Paste into Site Settings > Footer.');
        })
        .catch(err => {
          console.error('❌ Clipboard copy failed:', err);
        });
    };
  } else {
    console.warn('⚠️ Copy button not found in DOM');
  }

  const dismissBtn = document.getElementById('dismiss-panel');
  if (dismissBtn) {
    console.log('🔗 Binding Dismiss button...');
    dismissBtn.onclick = () => {
      console.log('❌ Dismissing Theme Switcher panel');
      panel.remove();
    };
  } else {
    console.warn('⚠️ Dismiss button not found in DOM');
  }
}

// Delay until DOM is ready and extension environment is confirmed
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('📦 DOM ready. Checking for Webflow Designer Extension API...');
    const designerApi = window.Webflow?.require?.('designer-extension');
    if (designerApi) {
      console.log('✅ Designer Extension API available');
      initThemeSwitcherExtension();
    } else {
      console.warn('❌ Designer Extension API not found');
    }
  } catch (err) {
    console.error('❌ Theme Switcher Extension failed to initialize:', err);
  }
});