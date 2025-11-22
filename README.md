# 🌓 Theme Switcher App for Webflow

A simple OAuth-powered Webflow app + Designer extension that injects the Theme Switcher script into your project head.

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

1. User clicks **Connect to Webflow**
2. OAuth exchange returns `access_token` + `site_id`
3. App shows status and copyable script
4. Open the Designer extension and click **Enable Theme Switcher**
5. Script is injected into head automatically; publish to go live

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
| `/` | Home page with "Connect to Webflow" button |
| `/callback` | Handles Webflow OAuth and token exchange |
| `/installed` | Post-auth confirmation and extension guidance |
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

- Uses **Webflow OAuth** + **Designer Extension API** for injection
- All actions require **user confirmation**
- Fully uninstallable via Webflow **Apps & Integrations**

---

## ✅ Review Checklist (Webflow)

- **Scopes requested**: `custom_code:read custom_code:write sites:read sites:write pages:read pages:write authorized_user:read` (drop `pages:write` if not required).
- **Includes**: `include=authorized_user&include=site` in the authorize URL to fetch user/site context.
- **Redirect URI**: `https://theme-toggle-webflow.vercel.app/callback` (must match in Webflow app settings).
- **Paid-plan note**: Custom Code requires a paid/hosted Webflow site; free sites will not auto-inject.
- **Success callback**: `/callback` performs exchange → redirects to `/installed`; injection is performed via the Designer extension.
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
