/**
 * Seed a development user into the local Firebase emulators.
 * Usage (PowerShell):
 *  $env:FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"; \
 *  $env:FIRESTORE_EMULATOR_HOST="localhost:8080"; \
 *  node ./tools/seed-dev-user.js
 *
 * Adjust ports if your emulators run on different ports.
 */


import admin from 'firebase-admin';

const PROJECT_ID = process.env.FIREBASE_PROJECT || 'demo-project';


process.env.GCLOUD_PROJECT = PROJECT_ID;

// Initialize Admin SDK (will connect to emulators when env vars are set)
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}


const auth = admin.auth();
const db = admin.firestore();

async function main() {
  // Create or get a test user
  const email = 'dev+user@example.com';
  const password = 'password123';
  let uid;

  try {
    const user = await auth.getUserByEmail(email);
    uid = user.uid;
    console.log('User already exists:', uid);
  } catch (err) {
    const user = await auth.createUser({ email, password }); //
    uid = user.uid;
    console.log('Created auth user:', uid);
  }

  // Ensure a users/{uid} document exists with required fields for onboarding and seller flows
  const userDocRef = db.collection('users').doc(uid);
  const data = {
    displayName: 'Dev User',
    role: 'USER',
    status: 'ACTIVE',
    oneAccountAcknowledged: true,
    isSeller: true,
    stripeAccountId: 'acct_test_123',
    storeId: '',
    sellerStatus: 'NONE',
  };

  await userDocRef.set(data, { merge: true });
  console.log('Wrote users/%s document', uid);

  console.log('\nDev credentials:');
  console.log('  email:', email);
  console.log('  password:', password);
  console.log('\nNow open your app, sign in with the test user, and continue the flow.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
