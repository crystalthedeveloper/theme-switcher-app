# 🎨 Theme Switcher App for Webflow

This Webflow OAuth app allows users to securely connect their Webflow account and inject a light/dark theme toggle script into their selected Webflow site using the Webflow Custom Code API.

> 🛠️ Until Webflow approves this app, script injection will only work on hosted (paid) sites outside of Developer Workspace.

---

## ✨ Features

- 🔐 Webflow OAuth authentication
- ⚙️ Script injection via Webflow Custom Code API (or manual fallback)
- 🗂️ Site selection after OAuth
- ✅ Success screen with install confirmation or manual script
- 🧠 Built with Next.js and deploys to Vercel
- 🧪 Test mode support with console logs
- 📱 Responsive design for mobile users
- 🧼 Clean, accessible UI and code

---

## 🚀 How It Works

1. User clicks **Connect to Webflow**
2. App completes OAuth and exchanges code for access token
3. User selects which hosted site they want to use
4. App injects the theme switcher script via API (or shows manual fallback)
5. User sees a success screen

---

## 🧩 Script Injected

```html
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
```

This will appear in the footer of the chosen Webflow site — or users can paste it manually into Webflow’s **Project Settings → Custom Code** section.

The script is lightweight and runs only after the page has fully loaded, ensuring no impact on site performance.

---

## 📁 Pages Overview

- `/` – Home page with "Connect to Webflow" button
- `/callback` – Handles Webflow OAuth and sends user to select-site
- `/select-site` – Lets users choose a hosted Webflow site
- `/confirm` – Injects the theme script into the selected site’s first page
- `/success` – Confirmation screen (with `?manual=true` fallback)

---

## ⚙️ Environment Variables

Create a `.env.local` file or add to your Vercel Project Settings:

```
NEXT_PUBLIC_BASE_URL=https://theme-switcher-app.vercel.app
NEXT_PUBLIC_WEBFLOW_CLIENT_ID=your_webflow_client_id
WEBFLOW_CLIENT_SECRET=your_webflow_client_secret
WEBFLOW_REDIRECT_URI=https://theme-switcher-app.vercel.app/callback
```

---

## 🧪 Testing Notes

- Works only on hosted (paid) Webflow sites
- Developer Workspace sites will return no IDs until the app is approved
- If injection fails, users will be redirected to `/success?manual=true`
- Add `?test=true` to URLs to see verbose logs in browser console

---

## 🧾 Marketplace Notes

This app:
- Uses the `/rest/sites/:id/pages/:page_id/custom-code` endpoint for injection
- Falls back to manual script copy if injection fails
- Provides a clear user flow from OAuth to installation
- Includes a “Try Again” button for retrying script injection
- Includes a `/settings` page for users to check token status, uninstall, or re-inject scripts manually

---

## 🧼 Uninstall Instructions

To remove the theme toggle script:
1. Go to your Webflow site’s **Project Settings**
2. Click the **Custom Code** tab
3. Delete the injected script from the **Footer Code** section
4. Go to **Apps & Integrations** and click **Uninstall App**

---

## 🌐 Localization Ready

All UI strings are wrapped in a translation layer (`locales/en.js`) for future i18n support.

---

© Crystal The Developer – [crystalthedeveloper.ca](https://www.crystalthedeveloper.ca)
