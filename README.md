# 🍽️ Hotel & Restaurant POS & Billing System

A modern, fast, mobile-friendly Restaurant POS & Hotel Billing PWA (Progressive Web App) built with **React 19**, **TypeScript**, **Tailwind CSS**, and **IndexedDB** for 100% offline-first local storage.

---

## ✨ Features

- 🧾 **Quick POS Terminal**: Fast dish selection, dynamic GST calculations (Inclusive / Exclusive), KOT generation, and split payment modes (Cash, UPI, Card, Room Tab).
- 📱 **Direct WhatsApp Invoicing**: Send digital bills with formatted text receipts directly to customer WhatsApp with one click.
- 💾 **100% Offline & Mobile Device Storage**: Uses browser IndexedDB + Cache API with Persistent Storage API support—works completely offline on mobile & desktop without external databases.
- 📸 **Menu Management with Direct Image Upload**: Upload dish photos straight from your device camera/gallery with automatic compression.
- 🪑 **Table & Room Management**: Live status tracking for Dine-In tables and Hotel room tabs.
- 🖨️ **Receipt Generation**: Supports 58mm / 80mm Thermal Receipts, A4 Invoices, and PDF downloads.
- 📊 **Reports & Analytics**: Sales analytics, daily GST reports, Excel / CSV exports, and audit logs.
- 📱 **Installable PWA**: Install as a native mobile/desktop app with offline service worker support.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🌐 1-Click Deployment

### Deploy to Vercel
1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your `billing_project` repository.
4. Framework Preset: **Vite**
5. Click **Deploy**!

### Deploy to Netlify
1. Go to [Netlify](https://www.netlify.com).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Select GitHub and pick `billing_project`.
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **Deploy site**!

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: IndexedDB (Local & Persistent Mobile Storage)
- **Exports**: jsPDF, jsPDF-AutoTable, XLSX
