(function () {
  const SCRIPT_SRC = 'https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js';
  const MARK_START = '<!-- THEME-SWITCHER-START -->';
  const MARK_END = '<!-- THEME-SWITCHER-END -->';
  const SNIPPET = [MARK_START, `<script src="${SCRIPT_SRC}" defer></script>`, MARK_END].join('\n');
  const MAX_RETRIES = 20;
  const RETRY_DELAY = 300;

  const createUI = (onClick) => {
    const root = document.createElement('div');
    root.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    root.style.padding = '16px';
    root.style.color = '#0f172a';

    const title = document.createElement('h2');
    title.textContent = 'Theme Switcher';
    title.style.margin = '0 0 8px 0';

    const desc = document.createElement('p');
    desc.textContent = 'Click Enable to add the Theme Switcher script to this project head.';
    desc.style.margin = '0 0 12px 0';

    const status = document.createElement('div');
    status.style.margin = '0 0 12px 0';
    status.style.fontSize = '13px';
    status.textContent = 'Ready';

    const btn = document.createElement('button');
    btn.textContent = 'Enable Theme Switcher';
    btn.style.padding = '10px 14px';
    btn.style.borderRadius = '6px';
    btn.style.border = 'none';
    btn.style.background = '#111827';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';

    btn.onclick = async () => {
      btn.disabled = true;
      status.textContent = 'Checking…';
      try {
        await onClick((message) => (status.textContent = message));
        status.textContent = '✅ Theme Switcher injected';
      } catch (err) {
        console.error('Theme Switcher inject error', err);
        status.textContent = '❌ Failed: ' + (err?.message || err);
      } finally {
        btn.disabled = false;
      }
    };

    root.appendChild(title);
    root.appendChild(desc);
    root.appendChild(btn);
    root.appendChild(status);

    document.body.innerHTML = '';
    document.body.appendChild(root);
  };

  const includesSnippet = (code) => {
    if (!code) return false;
    return code.includes(SCRIPT_SRC) || code.includes(MARK_START);
  };

  const inject = async (updateStatus) => {
    const app = window.webflow?.require?.('app');
    if (!app) throw new Error('Designer app API not available.');

    let existingHead = '';
    if (typeof app.getCustomCode === 'function') {
      try {
        existingHead = await app.getCustomCode({ type: 'head' });
      } catch (_) {
        existingHead = '';
      }
    }

    if (includesSnippet(existingHead)) {
      updateStatus('Theme Switcher already present.');
      return;
    }

    const payload = existingHead
      ? `${existingHead.replace(/\s*$/, '')}\n\n${SNIPPET}`
      : SNIPPET;

    await app.addCustomCode({ type: 'head', payload });
    updateStatus('Theme Switcher added to head.');
  };

  const start = (attempt = 0) => {
    if (!window.webflow?.require) {
      if (attempt >= MAX_RETRIES) {
        document.body.innerHTML = '<p style="padding:16px;color:#b91c1c;">Webflow Designer API unavailable.</p>';
        return;
      }
      return setTimeout(() => start(attempt + 1), RETRY_DELAY);
    }

    createUI(inject);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
