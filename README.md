# 🌓 Theme Switcher App for Webflow

Designer extension that injects the Theme Switcher script into your project head (no REST injection).

---

## ✨ Features

- 🔐 Secure OAuth flow with Webflow
- 🧩 Webflow Designer Extension with one-click injection
- 🧼 Clean, accessible UI built in Next.js
- 📱 Mobile-friendly and responsive layout
- ✅ Session-based install status detection
- 🧪 Developer test mode with console logs

---

## 🚀 How It Works

1. Install the app from the Webflow Apps panel.
2. Open **Webflow Designer → Apps → Theme Switcher**.
3. Click **Enable Theme Switcher**; the extension injects the script into the project head.
4. Publish your site.

---

## 🧩 Script Injected

The Designer extension injects:

```html
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
```

---

## 📁 Pages Overview

| Page | Purpose |
|------|---------|
| `/` | Homepage with extension instructions |
| `/callback` | (If enabled) Handles Webflow OAuth and token exchange |
| `/success` | Post-auth confirmation |
| `/public/extension.js` | Webflow Designer Extension UI (auto-injects via Designer API) |

---

## ⚙️ Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_BASE_URL=https://theme-toggle-webflow.vercel.app
NEXT_PUBLIC_WEBFLOW_CLIENT_ID=your_webflow_client_id
WEBFLOW_CLIENT_SECRET=your_webflow_client_secret
WEBFLOW_REDIRECT_URI=https://theme-toggle-webflow.vercel.app/callback
```

---

## 🧪 Testing Notes

- ✅ Works on **paid or hosted Webflow sites** (Designer extension injects into head)
- 🚫 Free projects cannot publish Custom Code
- 🧩 Designer extension is the only injection path
- 🔍 Add `?test=true` in the URL to enable console debug logs

---

## 🧾 Marketplace Notes

- Uses **Designer Extension API** for injection (no REST Custom Code calls)
- All actions require **user confirmation**
- Fully uninstallable via Webflow **Apps & Integrations**

---

## ✅ Review Checklist (Webflow)

- **Scopes requested**: Minimal (Designer Extension only; no REST injection).
- **Redirect URI**: `https://theme-toggle-webflow.vercel.app/callback` (if OAuth is enabled).
- **Paid-plan note**: Custom Code requires a paid/hosted Webflow site; free sites will not auto-inject.
- **Success callback**: `/callback` performs exchange → redirects to `/success`; injection is performed via the Designer extension.
- **Uninstall**: Users can remove access in Webflow Apps & Integrations; tokens are stored only in `sessionStorage` and not persisted server-side.
- **Policies**: Privacy Policy at `/privacy`; Terms of Use at `/terms`; support link `mailto:support@crystalthedeveloper.com`.

---

## 🧼 Uninstall Instructions

1. Go to **Webflow → Site Settings → Custom Code**
2. Remove the `<script>` tag from Footer
3. Go to **Apps & Integrations**, click **Uninstall App**

---

## 🌍 Localization Ready

All UI text is stored in `locales/en.ts` and can be adapted for multi-language support.

---

© 2025 Crystal The Developer – [crystalthedeveloper.ca](https://www.crystalthedeveloper.ca)
