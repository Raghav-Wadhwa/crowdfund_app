# 🚀 Deploy Backend to Render.com

This guide will help you deploy your Express backend to Render.com (FREE tier).

---

## 📋 Prerequisites

1. ✅ GitHub account with your code pushed
2. ✅ MongoDB Atlas database (you already have this)
3. ✅ Render.com account (free) - Sign up at https://render.com

---

## 🎯 Step-by-Step Deployment

### Step 1: Sign Up / Login to Render

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (recommended)
4. Authorize Render to access your GitHub repositories

---

### Step 2: Create a New Web Service

1. From Render Dashboard, click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - If first time: Click **"Connect GitHub"** and authorize
   - Search for: `crowdfund_app` (or your repo name)
   - Click **"Connect"** next to your repository

---

### Step 3: Configure Your Service

Fill in the following settings:

#### Basic Settings:
- **Name**: `crowdfund-backend` (or any name you prefer)
- **Region**: Choose closest to you (e.g., Oregon, Frankfurt)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`

#### Build & Deploy Settings:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### Instance Type:
- **Free** (select the free tier - $0/month)

---

### Step 4: Add Environment Variables

Scroll down to **"Environment Variables"** section and add these:

1. Click **"Add Environment Variable"**

**Variable 1:**
- **Key**: `MONGODB_URI`
- **Value**: Your MongoDB connection string
  ```
  mongodb+srv://username:password@cluster.mongodb.net/crowdfund?retryWrites=true&w=majority
  ```
  (Get this from MongoDB Atlas → Connect → Connect your application)

**Variable 2:**
- **Key**: `JWT_SECRET`
- **Value**: A random secret key (at least 32 characters)
  
  Generate one by running this in your terminal:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Copy the output and paste it here.

**Variable 3:**
- **Key**: `PORT`
- **Value**: `10000`

**Variable 4:**
- **Key**: `NODE_ENV`
- **Value**: `production`

---

### Step 5: Deploy!

1. Click **"Create Web Service"** button at the bottom
2. Render will now:
   - ✅ Clone your GitHub repo
   - ✅ Install dependencies (`npm install`)
   - ✅ Start your server (`npm start`)
   - ✅ Give you a public URL

3. **Wait 2-5 minutes** for the first deployment
4. Watch the logs in real-time to see progress

---

### Step 6: Get Your Backend URL

Once deployed successfully:

1. You'll see: **"Your service is live 🎉"**
2. Your backend URL will be something like:
   ```
   https://crowdfund-backend.onrender.com
   ```
3. **Copy this URL** - you'll need it for the next step!

4. Test it by visiting:
   ```
   https://crowdfund-backend.onrender.com/api/health
   ```
   You should see: `{"status":"OK","message":"Server is running!"}`

---

## 🔗 Step 7: Connect Frontend to Backend

Now that your backend is deployed, update your frontend to use it:

### Option A: Using GitHub Secrets (Recommended)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add secret:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://crowdfund-backend.onrender.com/api` (your Render URL + `/api`)
5. Click **"Add secret"**

6. Now push any change to trigger a new deployment:
   ```bash
   cd /Users/raghavwadhwa/Desktop/MERN/crowfund_mern
   git add .
   git commit -m "Connect frontend to deployed backend"
   git push origin main
   ```

### Option B: Hardcode (Quick Test)

Temporarily update `frontend/src/utils/api.js`:

```javascript
const api = axios.create({
  baseURL: 'https://crowdfund-backend.onrender.com/api',  // Your Render URL
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## ✅ Verify Everything Works

1. **Test Backend Health:**
   ```
   https://crowdfund-backend.onrender.com/api/health
   ```
   Should return: `{"status":"OK","message":"Server is running!"}`

2. **Test Frontend:**
   - Open your GitHub Pages site on mobile: `https://raghav-wadhwa.github.io/crowdfund_app/`
   - Try to login
   - Should work now! 🎉

---

## 🔄 Auto-Deployment

Render will automatically redeploy your backend when you:
- Push changes to the `main` branch
- Changes are detected in the `backend/` folder

---

## ⚠️ Important Notes

### Free Tier Limitations:
- ✅ 750 hours/month (enough for one service running 24/7)
- ⚠️ **Spins down after 15 minutes of inactivity**
- ⚠️ Takes ~30 seconds to wake up on first request
- ✅ Automatic SSL (HTTPS)

### Spin Down Behavior:
When your backend hasn't received requests for 15 minutes:
- It goes to sleep (saves resources)
- First request after sleep takes 30-60 seconds
- Subsequent requests are fast

**Solution:** Use a service like [UptimeRobot](https://uptimerobot.com) (free) to ping your backend every 5 minutes to keep it awake.

---

## 🐛 Troubleshooting

### Deployment Failed

**Check the logs:**
1. Go to Render Dashboard
2. Click on your service
3. Click **"Logs"** tab
4. Look for error messages

**Common issues:**
- ❌ Missing environment variables → Add them in Settings
- ❌ Wrong MongoDB URI → Check connection string
- ❌ Build command failed → Check `package.json` has all dependencies

---

### Backend Returns 502 Bad Gateway

**Causes:**
- Server crashed → Check logs
- Wrong start command → Should be `npm start`
- Port issue → Make sure you're using `process.env.PORT`

**Fix:**
Check `backend/server.js` line 67:
```javascript
const PORT = process.env.PORT || 5001;  // Should use process.env.PORT
```

---

### Login Still Fails on Mobile

**Check:**
1. ✅ Backend is deployed and accessible
2. ✅ Frontend GitHub secret `VITE_API_URL` is set correctly
3. ✅ Frontend was rebuilt after adding secret (push a new commit)
4. ✅ Clear mobile browser cache

**Debug:**
Open browser console on mobile and check what URL it's trying to call.

---

## 📊 Monitor Your Deployment

### Render Dashboard:
- View logs in real-time
- See deployment history
- Monitor resource usage
- Check uptime

### MongoDB Atlas:
- Monitor database connections
- Check query performance
- View logs

---

## 🎉 You're Done!

Your full stack app is now deployed:

```
📱 Mobile/Laptop
    ↓
🌐 Frontend: https://raghav-wadhwa.github.io/crowdfund_app/
    ↓ API calls
🖥️  Backend: https://crowdfund-backend.onrender.com
    ↓
🗄️  MongoDB Atlas
```

---

## 🔐 Security Checklist

- ✅ MongoDB URI is in environment variables (not in code)
- ✅ JWT_SECRET is in environment variables (not in code)
- ✅ CORS is configured properly
- ✅ Using HTTPS (Render provides this automatically)
- ✅ Passwords are hashed with bcrypt

---

## 📚 Useful Links

- Render Dashboard: https://dashboard.render.com
- Render Docs: https://render.com/docs
- MongoDB Atlas: https://cloud.mongodb.com
- Your GitHub Repo: https://github.com/Raghav-Wadhwa/crowdfund_app

---

**Need help?** Check the Render logs first - they usually show exactly what went wrong!

