Deployment checklist — HobbyDork

This document lists the exact steps to prepare and deploy the Next.js app to Vercel and Cloud Functions for Stripe Connect + webhooks.

Pre-requisites
- You must have: Firebase CLI authenticated (firebase login), access to the Firebase project, and Vercel project access.
- Stripe account with test keys (pk_test_..., sk_test_...) and a webhook secret (whsec_...).

Local verification
1. Type-check and build locally

```bash
# in repo root
npm install
npm run typecheck
npm run build
```

2. Run dev server and run smoke tests (signup, login, Stripe connect in test mode, create store/listing)

```bash
npm run dev
# open http://localhost:9002 and exercise flows
```

Cloud Functions: prepare & deploy
1. Ensure functions secrets (recommended) are set for production:

- STRIPE_SECRET (the live secret key, e.g. sk_live_...)
- STRIPE_WEBHOOK_SECRET (the webhook signing secret)
- Optionally: STRIPE_SECRET_KEY (we accept either name as fallback)

Set secrets via Firebase CLI or Console. CLI example:

```bash
# set secret values (will prompt for values)
firebase functions:secrets:set STRIPE_SECRET
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# optional fallback name if you used this earlier
firebase functions:secrets:set STRIPE_SECRET_KEY
```

2. Ensure the function APP_BASE_URL will be correct. We rely on `process.env.APP_BASE_URL` (fallback to `NEXT_PUBLIC_URL`). You can set an env var for the functions runtime if desired, or set APP_BASE_URL in your Vercel environment for the Next app.

3. Deploy functions (example — replace names as needed):

```bash
# from repo root
cd functions
firebase deploy --only functions:onboardStripe,functions:createCheckoutSession,functions:stripeWebhook,functions:getStripePayouts
```

After deploy, note the HTTPS endpoints (for webhooks you may need the function URL). If using Functions callable endpoints, your frontend calls `httpsCallable(functions, 'onboardStripe')` which works with deployed functions.

Stripe webhook configuration
1. In Stripe Dashboard -> Developers -> Webhooks -> Add endpoint
- Set URL to the deployed function endpoint for `stripeWebhook` OR to the Firebase functions URL that handles webhooks (e.g. https://us-central1-<project>.cloudfunctions.net/stripeWebhook)
- Select events you care about (e.g., checkout.session.completed, payment_intent.succeeded)
- Save and copy the webhook secret value (whsec_...)

2. Ensure `STRIPE_WEBHOOK_SECRET` secret in Firebase matches the value Stripe provided.

Vercel deployment & env vars
1. In Vercel Project Settings -> Environment Variables, add production values:
- NEXT_PUBLIC_URL = https://hobbydork.com
- STRIPE_PUBLIC_KEY = pk_live_xxx (client-side publishable key)
- STRIPE_SECRET_KEY (optional if your Next APIs expect this) or STRIPE_SECRET if you prefer that name
- FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID (the client-side Firebase config) — if used by the client
- Any other third-party keys (Sentry, analytics)

2. Trigger a production deployment in Vercel (via push to main or manual deploy).

DNS / domain hookup (hobbydork.com)
1. In Vercel -> Domains -> Add hobbydork.com.
2. Recommended: Use Vercel nameservers (Vercel provides NS records).
   - Update your domain registrar's nameservers to the values Vercel shows.
   - Wait for propagation (minutes → hours).
3. Alternative: add A records / CNAME per Vercel instructions.
4. After verification, Vercel automatically provisions SSL.

Important: Stripe server-side secrets and logic should live only in Firebase Cloud Functions.
The Next API routes under `src/app/api/stripe/*` are deprecated and will return a 410 response. Ensure your frontend uses Firebase callable functions (`onboardStripe`, `createCheckoutSession`) or the deployed functions' HTTPS endpoints instead of these Next API routes.

Post-deploy verification
- Visit https://hobbydork.com, verify SSL and app load.
- Test Stripe Connect end-to-end (in test mode): start onboarding from app -> complete in Stripe -> Stripe redirects to `/onboarding/success` -> app marks `stripeOnboarded` and redirects to `/store/create`.
- Send a test webhook from Stripe dashboard and confirm `stripeWebhook` processes it (check Firebase logs).

Useful commands

```bash
# view functions logs
firebase functions:log --only stripeWebhook

# deploy only functions
cd functions
firebase deploy --only functions:onboardStripe,functions:createCheckoutSession,functions:stripeWebhook,functions:getStripePayouts

# set function secrets
firebase functions:secrets:set STRIPE_SECRET
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

If you want, I can generate a concise list of environment variable values you should add to Vercel (I will not show secrets here).

---

If you'd like, I can now:
- produce a one-click checklist of exact env vars to paste into Vercel, or
- prepare a `deploy.sh` script (non-sensitive) that runs build and prints next steps, or
- open and update `functions/src/index.ts` to read APP_BASE_URL from an environment variable (already done).

Which of those would you like next?