# 🌓 Theme Switcher for Webflow

Designer Extension that injects the Theme Switcher script into your site head. No REST injection.

---

## What it does

1. Install the app from the Webflow Apps panel.  
2. Open **Webflow Designer → Apps → Theme Switcher**.  
3. Click **Enable Theme Switcher** (idempotent; skips duplicates).  
4. Publish your site.

Injected snippet:
```html
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
```

---

## Pages

| Page | Purpose |
|------|---------|
| `/` | Landing with extension instructions |
| `/callback` | (If OAuth enabled) Token exchange |
| `/success` | Post-auth confirmation |
| `/public/extension.js` | Designer Extension UI + injection |

---

## Packaging the Designer Extension

Use the Webflow CLI packaging command with the `public/` directory as the public dir:

```bash
WEBFLOW_SKIP_UPDATE_CHECKS=true npm run package:extension
```

This zips `webflow.json` and the `public/` tree into `bundle.zip`, which you can upload in the Webflow Apps dashboard.

---

## Env (if OAuth is enabled)

```env
NEXT_PUBLIC_WEBFLOW_CLIENT_ID=54a06798c0f6f8959eea506f62c95a29f3c86443e291a2a643a36fdb54b87633
WEBFLOW_CLIENT_SECRET=
NEXT_PUBLIC_WEBFLOW_REDIRECT_URI=https://theme-toggle-webflow.vercel.app/callback
```

---

## Notes

- Designer Extension API only; no REST Custom Code calls.  
- Requires a paid/hosted Webflow site to publish Custom Code.  
- Uninstall via Webflow **Apps & Integrations**.  
- Support: contact@crystalthedeveloper.ca  
- Policies: `/privacy` and `/terms`.

---

© 2025 Crystal The Developer – [crystalthedeveloper.ca](https://www.crystalthedeveloper.ca)
