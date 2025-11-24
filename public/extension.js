(() => {
  const SCRIPT_SRC = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher@v1.0.0/theme-switcher.js';
  const MARK_START = '<!-- THEME-SWITCHER-START -->';
  const MARK_END = '<!-- THEME-SWITCHER-END -->';
  const SNIPPET = [MARK_START, `<script src="${SCRIPT_SRC}" defer></script>`, MARK_END].join('\n');
  const MAX_RETRIES = 20;
  const RETRY_DELAY = 300;

  const setStatus = (msg) => {
    const el = document.getElementById('status');
    if (el) el.textContent = msg;
  };

  const includesSnippet = (code) => {
    if (!code) return false;
    return code.includes(SCRIPT_SRC) || code.includes(MARK_START);
  };

  const mergeHead = (existingHead) => {
    if (!existingHead || !existingHead.trim()) return SNIPPET;
    if (includesSnippet(existingHead)) return existingHead;
    return `${existingHead.replace(/\s*$/, '')}\n\n${SNIPPET}`;
  };

  const inject = async () => {
    const btn = document.getElementById('enable');
    if (btn) btn.disabled = true;
    setStatus('Checking existing head code…');

    const app = window.webflow?.require?.('app');
    if (!app) {
      setStatus('Designer app API not available.');
      if (btn) btn.disabled = false;
      return;
    }

    let currentHead = '';
    try {
      if (typeof app.getCustomCode === 'function') {
        currentHead = await app.getCustomCode({ type: 'head' });
      }
    } catch (err) {
      currentHead = '';
    }

    if (includesSnippet(currentHead)) {
      setStatus('Theme Switcher already present.');
      if (btn) btn.disabled = false;
      return;
    }

    const payload = mergeHead(currentHead);

    setStatus('Injecting Theme Switcher…');
    await app.addCustomCode({ type: 'head', payload });
    setStatus('✅ Theme Switcher injected into head.');
    if (btn) btn.disabled = false;
  };

  const start = (attempt = 0) => {
    const btn = document.getElementById('enable');
    if (!btn) return;

    if (!window.webflow?.require) {
      if (attempt >= MAX_RETRIES) {
        setStatus('Designer API unavailable. Reload and try again.');
        return;
      }
      return setTimeout(() => start(attempt + 1), RETRY_DELAY);
    }

    btn.onclick = inject;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => start());
  } else {
    start();
  }
})();
