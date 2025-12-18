Vercel environment variables (template)

Add the following environment variables in your Vercel project (Project → Settings → Environment Variables).
Mark secrets as `Encrypted` in Vercel.

Required (Production)
- NEXT_PUBLIC_URL = https://hobbydork.com
- STRIPE_PUBLIC_KEY = pk_live_xxx  # publishable key (client)
- STRIPE_SECRET_KEY = sk_live_xxx  # secret key (server) OR set STRIPE_SECRET as a Functions secret
- NEXT_PUBLIC_FIREBASE_API_KEY = your-firebase-api-key
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your-firebase-auth-domain
- NEXT_PUBLIC_FIREBASE_PROJECT_ID = your-firebase-project-id
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = your-firebase-storage-bucket
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = your-firebase-messaging-sender-id
- NEXT_PUBLIC_FIREBASE_APP_ID = your-firebase-app-id

Optional / Notes
- SENTRY_DSN, ANALYTICS_KEY, any other third-party keys.

Firebase Functions (secrets)
- STRIPE_SECRET (recommended) — set via `firebase functions:secrets:set` or via the Firebase Console
- STRIPE_WEBHOOK_SECRET — set via `firebase functions:secrets:set`

Tip: For local development, create a `.env.local` with client-side keys only. Do NOT commit secrets to source control.
