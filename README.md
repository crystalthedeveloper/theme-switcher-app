# 🌓 Theme Switcher App for Webflow

This Webflow OAuth app allows users to securely connect their Webflow account and install a dark/light theme toggle into their Webflow site.

> ⚠️ Webflow currently does **not allow automatic script injection** into Page or Site Settings via API for security reasons. Users must **manually paste** the script into the **Site Settings → Custom Code** panel.

---

## ✨ Features

- 🔐 Secure OAuth with Webflow
- 🎨 One-click copy of the theme script for easy paste
- 💡 Webflow Designer Extension panel to guide users
- 🧼 Accessible, clean UI built with Next.js
- 📱 Mobile-friendly interface
- ✅ Detects successful installation via session tracking
- 🧪 Developer test mode and console logging

---

## 🚀 How It Works

1. User clicks **Connect to Webflow**
2. App completes OAuth and exchanges code for access token
3. User selects which hosted Webflow site they want to use
4. App shows instructions and script to copy
5. User pastes the script manually into Webflow settings

---

## 🧩 Script to Add

```html
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
```

Add this into your **Webflow → Site Settings → Custom Code → Footer Code** for the theme toggle to work.

---

## 📁 Pages Overview

- `/` – Home page with "Connect to Webflow" button
- `/callback` – Handles Webflow OAuth and redirects after token exchange
- `/success?installed=true` – Confirms successful install and shows script
- `/extension.js` – Webflow Designer panel with Add/Copy buttons

---

## ⚙️ Environment Variables

Create a `.env.local` file or configure your Vercel environment:

```
NEXT_PUBLIC_BASE_URL=https://theme-toggle-webflow.vercel.app
NEXT_PUBLIC_WEBFLOW_CLIENT_ID=your_webflow_client_id
WEBFLOW_CLIENT_SECRET=your_webflow_client_secret
WEBFLOW_REDIRECT_URI=https://theme-toggle-webflow.vercel.app/callback
```

---

## 🧪 Testing Notes

- Works only on hosted (paid) Webflow sites
- Developer Workspace or free sites won’t allow script injection
- Designer extension fallback provides manual help panel
- Append `?test=true` in URL for verbose console logs

---

## 🧾 Marketplace Notes

- Uses Webflow Designer API only for contextual UI
- Does **not** auto-inject into Project Settings (not allowed by Webflow)
- Clear fallback and support guidance included
- Users can uninstall from Webflow settings at any time

---

## 🧼 Uninstall Instructions

To remove the theme switcher:

1. Go to your Webflow site’s **Project Settings**
2. Click **Custom Code**
3. Remove the `<script>` tag from the **Footer Code**
4. Go to **Apps & Integrations** and click **Uninstall App**

---

## 🌐 Localization Ready

All UI text is stored in `locales/en.js` for future i18n support.

---

© Crystal The Developer – [crystalthedeveloper.ca](https://www.crystalthedeveloper.ca)
