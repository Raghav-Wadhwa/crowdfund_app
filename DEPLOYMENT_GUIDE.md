# 🚀 GitHub Pages Deployment Guide

This guide explains how to deploy your React frontend to GitHub Pages using GitHub Actions.

---

## 📋 Setup Steps

### 1. Enable GitHub Pages

1. Go to your GitHub repository: https://github.com/Raghav-Wadhwa/crowdfund_app
2. Click **Settings** (top menu)
3. Scroll down to **Pages** (left sidebar)
4. Under **Build and deployment**:
   - **Source:** Select **GitHub Actions** (not "Deploy from a branch")
5. Save the settings

---

### 2. Push Your Changes

The workflow file is already created at `.github/workflows/deploy.yml`. Just push your changes:

```bash
cd /Users/raghavwadhwa/Desktop/MERN/crowfund_mern
git add .
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

---

### 3. Watch the Deployment

1. Go to your repo on GitHub
2. Click the **Actions** tab
3. You'll see a workflow running: "Deploy Frontend to GitHub Pages"
4. Wait for it to complete (usually 1-2 minutes)
5. Once done, you'll see a green checkmark ✅

---

### 4. Access Your Deployed Site

Your frontend will be live at:

```
https://raghav-wadhwa.github.io/crowdfund_app/
```

---

## 🔧 How It Works

### GitHub Actions Workflow

The workflow (`.github/workflows/deploy.yml`) does the following:

1. **Triggers** when you push changes to the `main` branch (specifically frontend files)
2. **Checks out** your code
3. **Sets up Node.js** (version 20)
4. **Installs dependencies** from `frontend/package.json`
5. **Builds the Vite app** (`npm run build`) → creates `frontend/dist/`
6. **Uploads** the `dist` folder as an artifact
7. **Deploys** to GitHub Pages

### Vite Configuration

The `frontend/vite.config.js` is configured with:

```javascript
base: '/crowdfund_app/'
```

This tells Vite to set the correct base path for assets (CSS, JS, images) when deployed to GitHub Pages.

**Why?** GitHub Pages serves your site at `https://username.github.io/repo-name/`, not at the root `/`. Without this, all your assets would 404.

---

## 🎯 Important Notes

### 1. **Frontend Only**

GitHub Pages will deploy **ONLY the frontend** (the React app). The backend API (`backend/server.js`) will **NOT** be deployed.

**For the backend, you'll need to deploy separately to:**
- Heroku
- Railway
- Render
- DigitalOcean
- AWS/Google Cloud/Azure
- etc.

### 2. **API URL Configuration**

When your backend is deployed, update the API URL in `frontend/.env`:

```env
# For local development
VITE_API_URL=http://localhost:5001/api

# For production (update after deploying backend)
VITE_API_URL=https://your-backend-url.herokuapp.com/api
```

Or use environment-based configuration:

```javascript
// frontend/src/utils/api.js
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://your-backend-url.com/api'
    : 'http://localhost:5001/api');
```

### 3. **Workflow Triggers**

The workflow runs when:
- ✅ You push to `main` branch **AND** files in `frontend/` changed
- ✅ You manually trigger it from GitHub Actions tab
- ❌ It does NOT run on pull requests (you can add this if needed)

---

## 🐛 Troubleshooting

### **Deployment Failed**

**Check the Actions tab:**
1. Go to **Actions** on GitHub
2. Click on the failed workflow
3. Click on the failed job (usually "build")
4. Read the error logs

**Common issues:**
- **Build errors:** Fix any TypeScript/ESLint errors in your frontend code
- **Dependency issues:** Make sure `frontend/package.json` has all dependencies
- **Node version:** The workflow uses Node 20, ensure your code is compatible

---

### **Site Shows 404 or Blank Page**

**1. Check if deployment succeeded:**
- Go to **Actions** tab → should show green checkmark
- Go to **Settings** > **Pages** → should show deployment URL

**2. Check the base path:**
- Make sure `vite.config.js` has `base: '/crowdfund_app/'`
- If you renamed your repo, update this path

**3. Check browser console:**
- Open browser DevTools (F12)
- Look for 404 errors on JS/CSS files
- If assets are loading from wrong path, base config is wrong

---

### **Changes Not Reflecting**

**Clear cache:**
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or open in incognito/private mode

**Check if workflow ran:**
- Go to **Actions** tab
- Make sure a new workflow ran after your latest commit
- If not, manually trigger it: **Actions** > **Deploy Frontend** > **Run workflow**

---

### **Workflow Not Running**

**1. Check if Pages is enabled:**
- **Settings** > **Pages** > **Source** should be "GitHub Actions"

**2. Check if workflow file exists:**
- `.github/workflows/deploy.yml` should be in your repo

**3. Manually trigger:**
- **Actions** > **Deploy Frontend to GitHub Pages** > **Run workflow** button

---

## 🔄 Re-deploying After Changes

Every time you push changes to the `frontend/` folder, the workflow will automatically:
1. Rebuild your app
2. Deploy the new version

**No manual steps needed!** Just:

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

---

## 📚 Related Files

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `frontend/vite.config.js` - Vite configuration with base path
- `frontend/package.json` - Frontend dependencies and scripts
- `frontend/.env` - Environment variables (not committed to Git)

---

## 🌐 Full Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│  GitHub Pages (Frontend)                        │
│  https://raghav-wadhwa.github.io/crowdfund_app/ │
│                                                 │
│  - React App                                    │
│  - Static files (HTML, CSS, JS)                │
│  - Served via CDN                               │
└────────────────┬────────────────────────────────┘
                 │
                 │ API Calls
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend Server (To be deployed separately)     │
│  https://your-backend-url.com                   │
│                                                 │
│  - Express API                                  │
│  - MongoDB connection                           │
│  - Authentication                               │
│  - Campaign/Donation logic                      │
└────────────────┬────────────────────────────────┘
                 │
                 │ Database
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  MongoDB Atlas                                  │
│  mongodb+srv://...                              │
│                                                 │
│  - User data                                    │
│  - Campaign data                                │
│  - Donation data                                │
└─────────────────────────────────────────────────┘
```

---

## ✅ Checklist

Before deploying:
- [ ] Frontend builds successfully locally (`cd frontend && npm run build`)
- [ ] No console errors in development mode
- [ ] `vite.config.js` has correct `base` path
- [ ] `.github/workflows/deploy.yml` exists
- [ ] GitHub Pages source is set to "GitHub Actions"
- [ ] Changes are committed and pushed to `main` branch

---

**Need help?** Check the Actions logs or ask for assistance!

