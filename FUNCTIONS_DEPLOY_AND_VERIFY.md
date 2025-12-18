Firebase Functions — deploy & verify

This file contains exact commands to deploy the Stripe-related Firebase Functions and quick verification steps to confirm webhooks and onboarding work.

1) Prepare secrets (interactive)

```bash
# Set production secrets (will prompt for the secret value)
firebase functions:secrets:set STRIPE_SECRET
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# Optional: if you used STRIPE_SECRET_KEY historically
firebase functions:secrets:set STRIPE_SECRET_KEY
```

2) Ensure APP_BASE_URL is set (optional for runtime)

You can set `APP_BASE_URL` in your Functions runtime environment or rely on `NEXT_PUBLIC_URL`.
To set env vars for the functions runtime (not secret):

```bash
# set environment variable for functions (requires Firebase CLI v11+)
firebase functions:env:set APP_BASE_URL="https://hobbydork.com"
```

3) Deploy the functions

```bash
cd functions
firebase deploy --only functions:onboardStripe,functions:createCheckoutSession,functions:stripeWebhook,functions:getStripePayouts
```

4) Confirm deployed functions and get logs

```bash
# show deployed function status
firebase functions:list

# tail logs for stripeWebhook (live)
firebase functions:log --only stripeWebhook --limit 200

# view logs for onboarding function
firebase functions:log --only onboardStripe --limit 200
```

5) Verify webhook handling (Stripe test)

Option A — Stripe Dashboard (recommended):
- In the Stripe Dashboard → Developers → Webhooks → Send test webhook
- Choose an event (e.g. `checkout.session.completed`) and send to your function URL.
- Check Firebase logs for `stripeWebhook` handling and database updates.

Option B — stripe CLI (if installed):

```bash
# run from your machine (requires stripe CLI & login)
stripe trigger checkout.session.completed --api-key sk_test_xxx
```

6) Verify Connect onboarding end-to-end

- From the deployed app (https://hobbydork.com) start the Connect flow.
- Complete onboarding in Stripe (test mode).
- Stripe will redirect to `/onboarding/success` (we set the function return_url to that path).
- Confirm the user's Firestore `users/<uid>` doc contains `stripeAccountId` and that `stripeOnboarded` is set (the success page updates it if present).

7) Quick sanity checks

- Visit `firebase functions:log --only stripeWebhook` after sending a webhook to verify receipts.
- Check Firestore `users` and `orders` collections for expected updates.
- If anything fails, inspect function logs and re-deploy after fixing.

Troubleshooting
- If you see signature verification errors in the logs, verify `STRIPE_WEBHOOK_SECRET` was set correctly in Functions Secrets.
- If the onboarding redirect lands in the wrong URL, ensure `APP_BASE_URL` / `NEXT_PUBLIC_URL` are set to your production domain.
