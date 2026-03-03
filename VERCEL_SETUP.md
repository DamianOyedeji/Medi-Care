# Vercel Deployment Setup

Quick reference for deploying frontend to Vercel.

## Prerequisites
- GitHub account with your code pushed
- Render backend URL (from previous step)
- Supabase project credentials

## Import Project

```
Dashboard > Add New > Project > Select your GitHub repo

Framework: Vite
Root Directory: ./ (or empty)
Build Command: npm run build
Output Directory: dist
```

## Environment Variables

Add these **BEFORE** clicking Deploy:

```env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://[your-service].onrender.com
```

## Deploy

1. Click **Deploy**
2. Wait 2-3 minutes
3. Get your URL: `https://[your-project].vercel.app`

## Update Backend CORS

Go back to Render and update:

```env
CORS_ORIGINS=https://[your-project].vercel.app,https://[your-project]-preview-*.vercel.app
```

Then redeploy backend.

## Optimization (Optional)

### Enable Image Optimization
Vercel does this automatically for Next.js, but for Vite:
- Images load fast via CDN automatically
- No additional config needed

### Set Cache Headers
Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Costs

- **Free:** Unlimited bandwidth
- **Cost:** $0
- **Includes:** 
  - Serverless functions
  - Edge middleware
  - Analytics
  - Preview deployments

## Auto-Deploy

Every git push → automatic deployment:

```bash
git add .
git commit -m "Update feature"
git push origin main  # Auto-deploys to Vercel
```
