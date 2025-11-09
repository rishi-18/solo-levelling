# Backend Deployment Instructions

## Critical: Backend Not Deployed

The Supabase Edge Function needs to be deployed before it can be used. The function code is ready, but it needs to be deployed to Supabase.

## Quick Deployment Steps

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/sqczriljcayzpseshzku
2. Login to your Supabase account

### Step 2: Create the Edge Function
1. Navigate to: **Edge Functions** in the left sidebar
2. Click **"Create a new function"**
3. Function name: `make-server-b509981e`
4. Click **"Create function"**

### Step 3: Add the Function Code
1. In the function editor, replace the default code with the contents of:
   - `src/supabase/functions/server/index.tsx`
2. Create a new file in the function called `kv_store.tsx`
3. Copy the contents of `src/supabase/functions/server/kv_store.tsx` into it

### Step 4: Set Environment Variables
1. Go to: **Settings** > **Edge Functions** > **Environment Variables**
2. Add these variables:
   - `SUPABASE_URL`: `https://sqczriljcayzpseshzku.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: (Get from Settings > API > service_role key)
   - `GEMINI_API_KEY`: (Optional - for AI mission generation)

### Step 5: Create the KV Store Table
1. Go to: **SQL Editor** in the left sidebar
2. Run this SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS kv_store_b509981e (
     key TEXT NOT NULL PRIMARY KEY,
     value JSONB NOT NULL
   );
   ```

### Step 6: Deploy
1. Click **"Deploy"** button in the function editor
2. Wait for deployment to complete (usually 30-60 seconds)

### Step 7: Verify Deployment
1. Test the health endpoint:
   ```
   https://sqczriljcayzpseshzku.supabase.co/functions/v1/make-server-b509981e/health
   ```
2. You should see: `{"status":"ok"}`

## Alternative: Deploy via CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref sqczriljcayzpseshzku

# Deploy function
supabase functions deploy make-server-b509981e --no-verify-jwt
```

## Troubleshooting

### Function returns 404
- Verify the function name is exactly: `make-server-b509981e`
- Check that the function is deployed (status should be "Active")

### Function returns 500 errors
- Check the function logs in Supabase Dashboard
- Verify environment variables are set correctly
- Ensure the KV store table exists

### CORS errors
- The function has CORS enabled for all origins
- If issues persist, check browser console for specific error

### Authentication errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check that the key has the correct permissions

## Testing After Deployment

Open browser console and run:
```javascript
fetch('https://sqczriljcayzpseshzku.supabase.co/functions/v1/make-server-b509981e/health')
  .then(r => r.json())
  .then(console.log)
```

Expected output: `{status: "ok"}`

## Next Steps

Once deployed, the app should automatically connect to the backend. You can verify by:
1. Opening the app
2. Checking the browser console for "Backend connection: OK"
3. Trying to sign up or login

