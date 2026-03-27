# Production Smoke Test Checklist

**Target:** Post-deployment validation of core marketplace flows  
**Duration:** ~5-10 minutes  
**Environment:** Production or staging with real Firebase/Stripe connection

---

## Pre-Flight
- [ ] Confirm all Firebase Functions are deployed and healthy in Console
- [ ] Verify Stripe webhook endpoint is active and pointing to deployed `stripeWebhook` URL
- [ ] Confirm scheduled functions exist: `closeListingAuctions`, `dailySellerEnforcement`

---

## Test 1: Auction Winner Flow (Critical Path)

### Setup
1. Create a test auction listing with short duration (15 min)
2. Place 2-3 bids from different accounts
3. Wait for auction to expire OR manually trigger close (advance server time if testing)

### Expected Results
- [ ] After close window, listing shows:
  - `status = 'Ended'`
  - `winnerUid` = highest bidder's UID
  - `winningBid` = highest bid amount
  - `paymentStatus = 'PENDING'`
- [ ] Winner receives notification: "Auction Won"
- [ ] Seller receives notification: "Auction Ended"

### Winner Checkout
1. Non-winner opens listing → Confirm "Proceed to Checkout" is blocked/hidden
2. Winner opens listing → Confirm "Pay Winning Bid" CTA appears
3. Winner clicks CTA → Completes Stripe Checkout
4. After webhook fires (~5-10s):
   - [ ] Listing updates to `status = 'Sold'`, `paymentStatus = 'PAID'`
   - [ ] Order document shows `status = 'Confirmed'`, `paidAt` timestamp
   - [ ] Buyer receives "Payment Confirmed" notification
   - [ ] Seller receives "New Order Received" notification

**Pass Criteria:** Full auction lifecycle with winner-only payment and proper settlement.

---

## Test 2: Buy It Now Stock Management

### Setup
1. Create a Buy It Now listing with `quantity = 3`
2. Purchase 1 unit as buyer A
3. Purchase 1 unit as buyer B
4. Purchase final unit as buyer C

### Expected Results After Each Purchase
- [ ] **Purchase 1:** `quantity = 2`, listing still `Active` and `Visible`
- [ ] **Purchase 2:** `quantity = 1`, listing still `Active` and `Visible`
- [ ] **Purchase 3:** `quantity = 0`, `status = 'Sold'`, `visibility = 'Invisible'`
- [ ] Listing no longer appears in browse page after final purchase
- [ ] All 3 buyers receive order confirmations

**Pass Criteria:** Stock decrements correctly; listing auto-hides when sold out.

---

## Test 3: Listing Moderation (Auto-Flagging)

### Setup
1. Create a listing with flagged content in title/description:
   - Include phrases like: "contact me at", "email:", "call me", "whatsapp", or external URL
   - OR use excessive caps: "BEST DEAL EVER!!!"
   - OR add 10+ tags

### Expected Results
- [ ] Listing is created but immediately flagged
- [ ] `moderationStatus = 'FLAGGED'`
- [ ] `moderationReasons` array populated with detected issue(s)
- [ ] `visibility = 'Invisible'` (auto-hidden)
- [ ] Seller receives moderation notification explaining the flag

**Pass Criteria:** Auto-moderation triggers and hides suspicious content; seller is notified.

---

## Test 4: Draft Persistence (Create Flow)

### Setup
1. Start creating a listing (fill title, price, category)
2. **Before submitting**, refresh the page or close tab
3. Return to create listing page

### Expected Results
- [ ] Draft fields are restored from Firestore (title, price, category, etc.)
- [ ] Photo preview is restored if image was uploaded
- [ ] Tags and description persist
- [ ] After successful listing create, draft document is deleted

**Pass Criteria:** No data loss on accidental navigation; draft cleanup after publish.

---

## Test 5: Search Relevance Ranking

### Setup
1. Create test listings with varied titles:
   - "Vintage Rolex Submariner"
   - "Rolex Daytona 1968"
   - "Omega Speedmaster Professional"
2. Search for: **"Rolex"**

### Expected Results
- [ ] Listings with "Rolex" in title appear first
- [ ] Exact phrase matches rank higher than partial
- [ ] Non-Rolex listings (Omega) do not appear in results

### Repeat with seller/tag search
Search for a specific seller username or tag:
- [ ] Listings by that seller rank near top
- [ ] Listings with that exact tag appear prominently

**Pass Criteria:** Search feels intuitive; full-phrase title matches rank highest.

---

## Test 6: Expired Listing Hiding (Buy It Now)

### Setup
1. Create a Buy It Now listing with 1-day expiration
2. Advance time OR wait 24 hours
3. Visit browse page and listing detail

### Expected Results
- [ ] Expired listing shows "EXPIRED" badge on card
- [ ] Listing is grayed out and checkout is disabled
- [ ] Expired listings are **hidden** from browse results by default
- [ ] If viewed directly, "This listing has expired" message appears

**Pass Criteria:** Expired BIN listings are visually marked and excluded from active browse.

---

## Test 7: Seller Onboarding (Shipping Agreement)

### Setup
1. Go to `/seller/onboarding` as a new seller
2. Proceed through steps 1-2
3. Reach **Step 3: Trust**

### Expected Results
- [ ] Prominent red warning banner about 2-day shipping enforcement
- [ ] Checkbox states: "I will get packages RECEIVED by carrier within 2 business days or buyers can cancel"
- [ ] Cannot proceed without checking shipping agreement
- [ ] After onboarding, `agreedToShippingStandards = true` in user profile

**Pass Criteria:** Sellers cannot skip shipping agreement; policy is clear and enforced.

---

## Test 8: Friendly Error Messages

### Setup
Trigger common user errors:
1. Try to sign up with already-registered email
2. Enter wrong password on login
3. Try to checkout without being logged in
4. Submit a listing form with missing required fields

### Expected Results
- [ ] Error toasts show **friendly, actionable messages** (not raw Firebase codes)
- [ ] Examples:
  - "This email is already registered. Please log in instead."
  - "Incorrect password. Please try again."
  - "Please log in to continue."
  - (NOT: "auth/email-already-in-use" or raw stack traces)

**Pass Criteria:** All error messages are human-readable and helpful.

---

## Test 9: Order Tracking & Shipping Label

### Setup
1. Complete a purchase (any listing type)
2. As seller, go to order detail page
3. Generate shipping label via Shippo integration

### Expected Results
- [ ] Order shows `status = 'Confirmed'` after payment
- [ ] Seller can click "Generate Label"
- [ ] After label creation:
  - `trackingNumber` populated
  - `labelUrl` available for download
  - `status = 'Shipped'`
- [ ] Buyer receives "Order Shipped" notification with tracking

**Pass Criteria:** Label generation works; tracking propagates to buyer.

---

## Test 10: Visibility Toggle (Owner-Only View)

### Setup
1. Create a listing with `visibility = 'Invisible'`
2. View your storefront as the owner
3. View the same storefront as another user or logged out

### Expected Results
- [ ] **Owner view:** Invisible listings visible in storefront tab
- [ ] **Public view:** Invisible listings hidden from storefront and browse
- [ ] Browse page never shows invisible listings
- [ ] Direct link to invisible listing returns 404 for non-owners

**Pass Criteria:** Visibility controls work as documented for owners vs public.

---

## Final Sign-Off

**All tests passed?**
- [ ] Yes → Deploy approved for production traffic
- [ ] No → Document failures and roll back or hotfix

**Common Failure Modes:**
- Webhook not receiving events → Check Stripe dashboard endpoint config
- Scheduled jobs not running → Verify Cloud Scheduler enabled in GCP Console
- Index errors → Deploy indexes first: `firebase deploy --only firestore:indexes`
- Permission denied on writes → Review `firestore.rules` for new field validations

---

**Test Runner:** _______________  
**Date:** _______________  
**Environment:** ☐ Staging  ☐ Production  
**Build/Commit:** _______________
