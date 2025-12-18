#!/usr/bin/env bash
# Deploy helper (local) — does not run firebase deploy (requires auth).
# Usage: ./deploy.sh

set -e

echo "Running local checks..."
npm run typecheck
npm run build

echo "\nLocal checks passed. Next steps:\n"

echo "1) Ensure Vercel environment variables are set (see VERCEL_ENV.md)"
echo "2) Deploy functions (from repo root):"
echo "   cd functions"
echo "   # set secrets if needed (interactive):"
echo "   firebase functions:secrets:set STRIPE_SECRET"
echo "   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET"
echo "   firebase deploy --only functions:onboardStripe,functions:createCheckoutSession,functions:stripeWebhook,functions:getStripePayouts"

echo "3) Push to main or trigger Vercel deploy.\n"

echo "After deploy:"
echo "- Verify https://hobbydork.com loads and SSL is active"
echo "- Test Stripe Connect end-to-end (test mode)"

echo "Done."
