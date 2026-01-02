# Deploy PesaFlow Server to Render

This guide walks through deploying the `server` (Express) to Render to get a public HTTPS callback URL required by the M-Pesa sandbox.

Steps
1. Push your repository to GitHub if not already:

```powershell
git add .
git commit -m "Prepare server for Render deployment"
git push origin main
```

2. Open Render (https://dashboard.render.com) and click **New** → **Web Service**.

3. Connect your GitHub repo and select the repository `YOUR_USERNAME/pesaflow` and branch `main`.

4. In **Advanced** settings:
   - Set **Root Directory** to `server`
   - Set **Start Command** to `node index.js`
   - Leave **Build Command** empty (no build step required)

5. Add Environment Variables (in Render Dashboard > Environment > Add Variable):
   - `MPESA_CONSUMER_KEY` = (your consumer key)
   - `MPESA_CONSUMER_SECRET` = (your consumer secret)
   - `MPESA_PASSKEY` = (your passkey) — optional if using sandbox default
   - `MPESA_SHORTCODE` = (your shortcode) — optional
   - `FIREBASE_SERVICE_ACCOUNT` = (stringify the JSON of your Firebase service account)
   - `RENDER_EXTERNAL_URL` = (you can leave empty; Render sets `RENDER_EXTERNAL_URL` automatically)

6. Deploy and wait for the service to become healthy. Render assigns a public HTTPS URL (e.g., `https://pesaflow-server.onrender.com`).

7. In the M-Pesa sandbox dashboard, ensure your callback URL matches `https://<your-render-url>/callback` (if required) and test an STK Push.

Notes
- `FIREBASE_SERVICE_ACCOUNT` must be the full JSON text. On Render, paste the entire JSON as the env value.
- The `render.yaml` file in the repo can be used with Render's infrastructure as code or you can use the UI. Edit `render.yaml` to set your GitHub repo URL before importing.

If you want, I can prepare a small PR with the `render.yaml` updated with your GitHub repo URL (you'll need to provide it), or I can walk you through the Render UI steps while you perform them.
