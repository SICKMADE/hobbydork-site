#!/usr/bin/env bash
# verify_functions.sh — helper to run basic checks and tail logs after deploying functions
# Usage: ./verify_functions.sh

set -e

if ! command -v firebase >/dev/null 2>&1; then
  echo "firebase CLI not found. Install it: npm install -g firebase-tools"
  exit 1
fi

echo "1) List deployed functions"
firebase functions:list

echo "\n2) Tail stripeWebhook logs (ctrl+C to stop)"
firebase functions:log --only stripeWebhook --limit 200

echo "\n3) If you want to test via stripe CLI, run (replace sk_test key):"
echo "stripe trigger checkout.session.completed --api-key sk_test_xxx"

echo "\n4) To view recent logs for onboarding function:"
echo "firebase functions:log --only onboardStripe --limit 200"

echo "\nDone. Use the commands above to confirm behavior."
