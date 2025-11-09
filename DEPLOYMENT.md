# Backend Deployment Guide

## Issue: Backend Not Connected

The Supabase Edge Function needs to be deployed to be accessible. Follow these steps:

## Option 1: Deploy via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/sqczriljcayzpseshzku/functions
   - Login to your Supabase account

2. **Create/Deploy the Edge Function**
   - Click "Create a new function" or find `make-server-b509981e`
   - If it doesn't exist, create it with the name: `make-server-b509981e`
   - Copy the contents of `src/supabase/functions/server/index.tsx`
   - Paste into the function editor
   - Copy the contents of `src/supabase/functions/server/kv_store.tsx`
   - Create a file `kv_store.tsx` in the function
   - Set environment variables:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
     - `GEMINI_API_KEY`: (Optional) Your Gemini API key

3. **Deploy the Function**
   - Click "Deploy" or "Save"
   - Wait for deployment to complete

## Option 2: Deploy via Supabase CLI

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to your project**
   ```bash
   supabase link --project-ref sqczriljcayzpseshzku
   ```

4. **Deploy the function**
   ```bash
   supabase functions deploy make-server-b509981e
   ```

## Option 3: Manual Deployment via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/sqczriljcayzpseshzku/functions
2. Click "New Function"
3. Name it: `make-server-b509981e`
4. Copy the code from `src/supabase/functions/server/index.tsx`
5. Set up the KV store table (if not exists):
   ```sql
   CREATE TABLE IF NOT EXISTS kv_store_b509981e (
     key TEXT NOT NULL PRIMARY KEY,
     value JSONB NOT NULL
   );
   ```
6. Set environment variables in Supabase Dashboard:
   - Go to: Settings > Edge Functions > Environment Variables
   - Add:
     - `SUPABASE_URL`: https://sqczriljcayzpseshzku.supabase.co
     - `SUPABASE_SERVICE_ROLE_KEY`: (Get from Settings > API)
     - `GEMINI_API_KEY`: (Optional, for AI missions)

## Verify Deployment

After deployment, test the connection:

1. Visit: https://sqczriljcayzpseshzku.supabase.co/functions/v1/make-server-b509981e/health
2. You should see: `{"status":"ok"}`

## Troubleshooting

1. **Function not found (404)**
   - Verify the function name is exactly: `make-server-b509981e`
   - Check that the function is deployed

2. **CORS errors**
   - The function has CORS enabled, but verify your frontend URL is allowed

3. **Authentication errors**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
   - Check that the KV store table exists

4. **KV store errors**
   - Run the SQL to create the table (see Option 3)
   - Verify the table name matches: `kv_store_b509981e`

## Quick Test

After deployment, test in browser console:
```javascript
fetch('https://sqczriljcayzpseshzku.supabase.co/functions/v1/make-server-b509981e/health')
  .then(r => r.json())
  .then(console.log)
```

Expected: `{status: "ok"}`

