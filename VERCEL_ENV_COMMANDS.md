Vercel Environment Variables — Test Mode (instructions)

Use the Vercel Dashboard or the Vercel CLI to add these environment variables for your project. Keep live keys offline until you're ready to go live.

Recommended variables (Test mode):

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = pk_test_...
- `NEXT_PUBLIC_URL` = https://your-vercel-deployment.vercel.app
- Firebase client config vars (copy from your local `.env` or Firebase console):
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

Notes:
- Do NOT put `sk_test_...` in any `NEXT_PUBLIC_*` env. Secret Stripe keys belong only to server-side (Firebase Functions).
- For Firebase Functions, set `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET` using `firebase functions:secrets:set` (see `deploy_functions.ps1`).

Vercel CLI (interactive) example — run these and paste the values when prompted:

```bash
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add NEXT_PUBLIC_URL production
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
```

If you prefer to script via the Vercel API, consult Vercel docs — the CLI is simplest for one-off setup.

After setting variables, trigger a Vercel deploy from the dashboard or run:

```bash
vercel --prod
```

Verification tips (Test mode):
- Confirm `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` begins with `pk_test_`.
- Use the Stripe Dashboard in Test mode or the Stripe CLI to forward events to your deployed webhook.
- Keep live keys private until DNS/domain and testing are complete.
