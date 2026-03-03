# Render Deployment Setup

Quick reference for deploying to Render.

## Prerequisites
- GitHub account with your code pushed
- Supabase API keys (URL, anon key, service key)

## Create Web Service

```
New > Web Service > Select your GitHub repo

Name: mental-health-api
Branch: main
Region: Pick your region
Build Command: cd backend && npm install
Start Command: cd backend && npm start
Plan: Free
```

## Environment Variables

Add these in the Render dashboard:

```env
# Core
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Optional: AI/Email (for free version)
OPENAI_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=xxxx xxxx xxxx xxxx

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100

# After Frontend Deploy
CORS_ORIGINS=https://your-app.vercel.app
```

## Get Backend URL

After deploy completes (~5-10 min), copy your service URL:
```
https://[your-service-name].onrender.com
```

## Common Issues

**"Cannot find module" error**
- Ensure `backend/package.json` exists
- Check build command is: `cd backend && npm install`

**Port binding error**
- Add environment variable: `HOST=0.0.0.0`

**Logs show errors**
- Click "Logs" tab to see detailed errors
- Verify all environment variables are set

## Costs

- **Free:** 750 compute hours/month
- **Cost:** $0 if under 24/7 usage
- **Cold starts:** ~30 seconds on first request after idle
