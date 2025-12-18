<#
deploy_functions.ps1
PowerShell helper to set Stripe secrets and deploy Firebase Functions (Test mode).
Run this locally where you have the Firebase CLI authenticated.
#>

param(
    [string]$StripeSecret,
    [string]$StripeWebhookSecret,
    [string]$AppBaseUrl
)

function Require-Command {
    param([string]$cmd)
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "Required command '$cmd' not found. Please install and login first."
        exit 1
    }
}

Require-Command firebase

if (-not $StripeSecret) {
    $StripeSecret = Read-Host -Prompt "Paste your STRIPE secret (sk_test_...)"
}
if (-not $StripeWebhookSecret) {
    $StripeWebhookSecret = Read-Host -Prompt "Paste your STRIPE webhook secret (whsec_...) or press Enter to skip"
}
if (-not $AppBaseUrl) {
    $AppBaseUrl = Read-Host -Prompt "APP_BASE_URL (e.g. https://your-vercel-url.vercel.app)"
}

Write-Host "Setting Firebase Functions secret STRIPE_SECRET..."
firebase functions:secrets:set STRIPE_SECRET --data "$StripeSecret"

if ($StripeWebhookSecret -ne "") {
    Write-Host "Setting Firebase Functions secret STRIPE_WEBHOOK_SECRET..."
    firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --data "$StripeWebhookSecret"
}

if ($AppBaseUrl -ne "") {
    Write-Host "Setting Firebase Functions secret APP_BASE_URL..."
    firebase functions:secrets:set APP_BASE_URL --data "$AppBaseUrl"
}

Write-Host "Deploying functions (this may take a few minutes)..."
firebase deploy --only functions

Write-Host "Listing deployed functions:"
firebase functions:list || Write-Host "(listing failed)"

Write-Host "Tail stripeWebhook logs (press Ctrl+C to stop):"
Write-Host "firebase functions:log --only stripeWebhook --limit 200"

Write-Host "Done. Verify webhook behavior in Stripe Dashboard or with the Stripe CLI."
