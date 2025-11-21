# 🌓 Theme Switcher App for Webflow

A simple OAuth-powered Webflow app that helps users toggle between dark and light themes on their site — with a clean UI and a one-click script copy.

> ⚠️ Webflow does **not currently support automatic script injection** into Site or Page Settings via the API. Users must **manually paste** the script into **Site Settings → Custom Code**.

---

## ✨ Features

- 🔐 Secure OAuth flow with Webflow
- 🧩 Webflow Designer Extension with install buttons
- 🎨 One-click script copy for easy manual paste
- 🧼 Clean, accessible UI built in Next.js
- 📱 Mobile-friendly and responsive layout
- ✅ Session-based install status detection
- 🧪 Developer test mode with console logs

---

## 🚀 How It Works

1. User clicks **Connect to Webflow**
2. OAuth exchange returns `access_token` + `site_id`
3. App shows status and copyable script
4. User pastes script into Webflow **Footer Code**
5. Done — theme switcher works on all published pages

---

## 🧩 Script to Add

Paste this in **Webflow → Site Settings → Custom Code → Footer Code**:

```html
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
```

---

## 📁 Pages Overview

| Page | Purpose |
|------|---------|
| `/` | Home page with "Connect to Webflow" button |
| `/callback` | Handles Webflow OAuth and token exchange |
| `/installed` | (Optional) Post-auth confirmation and re-injection |
| `/public/extension.js` | Webflow Designer Extension UI |
| `/api/inject` | Calls Webflow's PATCH `/custom-code` endpoint |

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

- ✅ Works on **paid or hosted Webflow sites**
- 🚫 Won’t auto-inject on free projects (Webflow restriction)
- 🧩 Designer extension gives fallback UI
- 🔍 Add `?test=true` in the URL to enable console debug logs

---

## 🧾 Marketplace Notes

- Uses only **Webflow Data (REST) API**
- No auto-injection into Settings (against current policy)
- All actions require **user confirmation**
- Fully uninstallable via Webflow **Apps & Integrations**

---

## ✅ Review Checklist (Webflow)

- **Scopes requested**: `custom_code:read custom_code:write sites:read sites:write pages:read pages:write authorized_user:read workspaces:read` (drop `pages:write` if not required).
- **Redirect URI**: `https://theme-toggle-webflow.vercel.app/callback` (must match in Webflow app settings).
- **Paid-plan note**: Custom Code requires a paid/hosted Webflow site; free sites will not auto-inject.
- **Success callback**: `/callback` performs exchange → injection → redirects to `/installed` (no visible error page on success).
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
