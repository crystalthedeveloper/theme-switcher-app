// locales/en.js

const en = {
  success: {
    title: '✅ Installation Complete',
    message: 'The Theme Switcher script was successfully injected into your Webflow project.',
  },
  manual: {
    title: 'Manual Installation Instructions',
    note: 'If the Custom Code API was temporarily unavailable, you can still manually enable the toggle.',
    steps: [
      'Open your Webflow Project Settings.',
      'Go to the Custom Code tab.',
      'Paste the following code inside the Footer Code box:',
    ],
    removalNote: `To remove it, simply delete the script from your Custom Code tab.
To uninstall the app, visit your Webflow site’s Apps & Integrations tab and choose Uninstall under Theme Switcher.`,
  },
  nav: {
    home: '← Home',
    dashboard: 'Webflow Dashboard',
  },
};

export default en;