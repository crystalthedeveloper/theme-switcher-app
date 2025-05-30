# Theme Switcher App

This Webflow OAuth app allows users to securely connect their Webflow account and automatically inject the Theme Switcher script into their selected Webflow site using the Custom Code API.

## ✨ Features

- 🔐 Webflow OAuth authentication
- ⚙️ Script injection via Webflow Custom Code API
- ✅ Success confirmation screen
- 🧠 Built with Next.js & deploys easily to Vercel

## 🚀 How It Works

1. User clicks **Connect to Webflow**
2. OAuth redirects and exchanges code for access token
3. The Theme Switcher script is injected into the first site/page (or optionally selected page)
4. User is redirected to a success screen

## 🧩 Script Injected

```html
<script src="https://cdn.jsdelivr.net/gh/crystalthedeveloper/theme-switcher/theme-switcher.js" defer></script>
```

## 📦 Stack

- Next.js
- React
- Webflow REST API
- Vercel (recommended deployment)

## 📁 Pages

- `/` – Connect button (starts OAuth flow)
- `/callback` – Handles Webflow OAuth exchange and script injection
- `/success` – Confirmation screen
- `/select-site` – (Optional) Let users choose site/page

## 🔐 Required Env Vars

In your `.env.local` or Vercel project settings:

```
NEXT_PUBLIC_BASE_URL=https://theme-switcher-app.vercel.app
NEXT_PUBLIC_WEBFLOW_CLIENT_ID=your_webflow_client_id
WEBFLOW_CLIENT_SECRET=your_webflow_client_secret
```

---

© Crystal The Developer – [crystalthedeveloper.ca](https://www.crystalthedeveloper.ca)
