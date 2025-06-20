// /public/extension.js
Webflow.require('ix2').init();

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
script.defer = true;
document.body.appendChild(script);

script.onerror = () => {
  console.error('⚠️ Theme Switcher script failed to load.');
};