# **App Name**: HobbyDork VaultVerse

## Core Features:

- User Authentication and Status: Secure user authentication with ACTIVE, LIMITED, and SUSPENDED statuses, controlling access to app features. Each status determines which features a given user has access to. All features gated behind authentication.
- Storefront Creation and Management: Allow users to create and customize their own storefronts with a unique URL, store name, logo, 'About Me' section and payment preferences (PayPal or Venmo). Store names/URLs must be unique. Payment is mandatory before any listing or sale is created
- Listing Creation and Management: Enable users to create, edit, and manage collectible listings with detailed information, including title, category, description, price, condition, quantity, images, and optional tags. Only e-mail verified users can list Active items
- Search and Filtering: Implement global search functionality with filters for category, price range, and condition. Also provide search functionality specific to individual storefronts with a toggle. Provide result ordering by newest, price low->high, price high->low.
- Order Management and Tracking: Allow users to manage orders with various states (Pending Payment, Payment Sent, Shipped, Delivered, Completed, Cancelled) and enable tracking with tracking numbers and carrier info. User prompted to provide shipping address after hitting "I've sent payment"
- Community Chat with Moderation: Create a real-time community chat room with features like messaging, username/store name display, timestamping, and basic rate limiting. Abuse controls include user muting/hiding and blocking for DMs.
- Vault Unlock Easter Egg: Implement an Easter egg where typing "HOBBYDORK" in the search bar reveals a 4-digit PIN. This PIN unlocks a vault door button that appears on the homepage, rewarding the user for opening an e-mail.

## Style Guidelines:

- Primary color: Violet (#C64BE9) for a vibrant, collector-focused theme.
- Background color: Dark gray (#747474) to create a secure and muted backdrop.
- Accent color: Muted violet (#9575CD) for subtle highlights.
- Font: 'Inter' (sans-serif) for all text, with varying weights and comfortable line-heights to ensure readability.
- Use standard, clear icons for navigation and actions (Categories, Search as a 3D Nintendo button, Cart, Profile, Notifications, Settings).
- Grid-based layouts for listings, storefronts, and spotlight sections to maintain a structured and organized appearance.
- Micro-interactions: smooth transitions when loading lists and opening modals, looping light/glow animation on Spotlight store cards, explosion animation on easter egg PIN reveal.