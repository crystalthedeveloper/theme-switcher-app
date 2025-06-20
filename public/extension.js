// /public/extension.js

const themeScript = `<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js"><\/script>`;

// Create floating panel UI
const panel = document.createElement('div');
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
  <button id="add-script" style="margin-bottom: 10px; width: 100%;">➕ Add to This Page</button>
  <button id="copy-script" style="width: 100%;">📋 Copy Script for Footer</button>
  <small style="display:block; margin-top: 10px; font-size: 11px; color: #ccc;">To apply globally, paste it in Site Settings > Custom Code</small>
`;

document.body.appendChild(panel);

// Add to page via Embed block
document.getElementById('add-script').onclick = async () => {
  const extension = window.Webflow?.require?.('designer-extension');
  if (extension?.actions?.addEmbedBlock) {
    try {
      await extension.actions.addEmbedBlock({
        code: themeScript,
        location: 'footer',
      });
      alert('✅ Script added to the current page.');
    } catch (err) {
      alert('⚠️ Failed to inject script. Try again or use Copy Script.');
    }
  } else {
    alert('❌ Designer Extension API not available.');
  }
};

// Copy script to clipboard
document.getElementById('copy-script').onclick = () => {
  navigator.clipboard.writeText(themeScript).then(() => {
    alert('📋 Script copied! Paste into Site Settings > Footer.');
  });
};