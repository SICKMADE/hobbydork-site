// playwright-auction-flow.spec.ts
// Sample Playwright E2E test for marketplace auction, bidding, and checkout

import { test, expect } from '@playwright/test';

// Update these URLs and selectors to match your app
const baseUrl = 'http://localhost:9002';

test('Marketplace auction flow', async ({ page }: { page: import('playwright').Page }) => {
  // 1. Seller creates auction listing
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[name="email"]', 'seller@example.com');
  await page.fill('input[name="password"]', 'sellerpassword');
  await page.click('button[type="submit"]');
  await page.goto(`${baseUrl}/dashboard`);
  await page.click('text=New Listing');
  await page.fill('input[name="title"]', 'Test Auction Item');
  await page.fill('input[name="startingBid"]', '10');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/listings/);

  // 2. Buyer places bid
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[name="email"]', 'buyer@example.com');
  await page.fill('input[name="password"]', 'buyerpassword');
  await page.click('button[type="submit"]');
  await page.goto(`${baseUrl}/listings`);
  await page.click('text=Test Auction Item');
  await page.fill('input[name="bidAmount"]', '15');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Highest Bid: 15')).toBeVisible();

  // 3. Buyer wins and checks out
  // Simulate auction end (may need manual trigger or wait)
  await page.reload();
  await page.click('text=Pay Winning Bid');
  await expect(page).toHaveURL(/checkout/);
  await page.fill('input[name="cardNumber"]', '4242424242424242');
  await page.fill('input[name="expiry"]', '12/30');
  await page.fill('input[name="cvc"]', '123');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Payment Confirmed')).toBeVisible();

  // 4. Seller receives notification
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[name="email"]', 'seller@example.com');
  await page.fill('input[name="password"]', 'sellerpassword');
  await page.click('button[type="submit"]');
  await page.goto(`${baseUrl}/dashboard`);
  await expect(page.locator('text=New Order Received')).toBeVisible();
});