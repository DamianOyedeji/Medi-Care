# Deployment Guide: Vercel + Render + Supabase

This guide walks you through deploying your Mental Health Support app completely free using:
- **Frontend:** Vercel (free tier)
- **Backend:** Render (free tier)
- **Database:** Supabase (free tier)

---

## Step 1: Prepare Your Repository

### 1.1 Create a GitHub Repository
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Mental Health Support app"

# Create a new repository on GitHub (https://github.com/new)
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### 1.2 Ensure .gitignore is Configured
Add these to `.gitignore` if not already present:
```
node_modules/
.env
.env.local
.env.*.local
dist/
build/
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create a Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (it's easier)
3. Accept permissions

### 2.2 Deploy Backend Service
1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repository
3. Configure:
   - **Name:** `mental-health-api` (or your preferred name)
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm run start`
   - **Region:** Choose closest to your users

### 2.3 Add Environment Variables
In Render dashboard:
1. Go to your service → **Environment**
2. Add these variables:
```
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

OPENAI_API_KEY=sk-your-key
HUGGINGFACE_API_KEY=hf_your-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### 2.4 Get Your Backend URL
- Your service will deploy in ~5-10 minutes
- Copy the URL (looks like: `https://mental-health-api.onrender.com`)
- **You'll need this for the frontend deployment**

> ⚠️ **Note:** Render's free tier spins down after 15 minutes of inactivity. First request takes ~30s. For production, upgrade to paid tier.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create a Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize access to your repository

### 3.2 Deploy Frontend
1. Click **"Add New..."** → **"Project"**
2. Select your repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (or leave empty)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3.3 Add Environment Variables
Before deploying, add:

1. In **Environment Variables** section:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://mental-health-api.onrender.com
```

2. Click **Deploy**

### 3.4 Update Backend CORS
After getting your Vercel URL (e.g., `https://your-app.vercel.app`), update backend:

1. Go to Render dashboard
2. Edit your backend service environment variables
3. Update `CORS_ORIGINS`:
```
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-preview-*.vercel.app
```

4. Click "Deploy" to redeploy backend

---

## Step 4: Configure Supabase (Database)

### 4.1 Verify Supabase Config
1. Go to [app.supabase.com](https://app.supabase.com)
2. Your project should already exist
3. Get your credentials from **Settings** → **API**:
   - Copy `SUPABASE_URL`
   - Copy `anon public` key → `SUPABASE_ANON_KEY`
   - Copy `service_role` secret → `SUPABASE_SERVICE_KEY`

### 4.2 Verify Database Schema
1. Go to **SQL Editor** in Supabase
2. Verify tables exist (users, conversations, etc.)
3. If not, run the schema from `backend/database/schema.sql`

### 4.3 Test Connection
1. Frontend should load at your Vercel URL
2. Try signing up or logging in
3. Check Supabase logs if there are issues

---

## Step 5: Verify Everything Works

### Local Testing Before Deploy
```bash
# Test backend locally
cd backend
npm install
npm run dev

# In another terminal, test frontend
npm install
npm run dev
```

### Production Verification
1. **Frontend:** Visit your Vercel URL
2. **Backend Health Check:** Visit `https://your-backend.onrender.com/health`
3. **Sign Up:** Try creating an account
4. **Chat:** Test the AI chat feature

---

## Troubleshooting

### Backend won't deploy on Render
- Check **Logs** in Render dashboard
- Ensure all ENV variables are set
- Verify `backend/package.json` exists
- Ensure `backend/src/server.js` is correct

### Frontend shows "Cannot connect to API"
- Check `VITE_API_URL` environment variable
- Ensure backend service is running (check Render dashboard)
- Backend might be spinning up (can take 30+ seconds)
- Check browser console for CORS errors

### Supabase connection fails
- Verify `SUPABASE_URL` and keys match Render env vars
- Check Supabase project is active
- Verify database is not paused

### Port already in use (local dev)
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill it (replace PID)
taskkill /PID <PID> /F
```

---

## Cost Breakdown (All Free)

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Vercel** | Unlimited | No credit card needed |
| **Render** | 750 hrs/month | ~free if under 24/7 usage |
| **Supabase** | 500MB DB + 2GB bandwidth | PostgreSQL free tier |
| **GitHub** | Unlimited | Public repos free |

**Total Cost:** $0/month ✅

---

## Upgrade Path (When Needed)

1. **Vercel Pro:** $20/month → Higher bandwidth, faster builds
2. **Render Paid:** $12/month → Always on, no spin-down
3. **Supabase Pro:** $25/month → 8GB storage, more bandwidth

---

## Next Steps

1. Push your code to GitHub
2. Create Render account and deploy backend
3. Create Vercel account and deploy frontend
4. Update environment variables in both
5. Test the full application
6. Share your URL with users!

Questions? Check logs in Render/Vercel dashboards or test locally first.
