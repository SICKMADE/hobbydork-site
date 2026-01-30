"use client";

// Simple stepper illustration for 'How to Buy'
const buySteps = [
    { icon: ShoppingCart, label: 'Browse', desc: 'Find items you love' },
    { icon: Store, label: 'Add to Cart', desc: 'Add to your cart' },
    { icon: User, label: 'Checkout', desc: 'Pay securely' },
    { icon: Star, label: 'Track Order', desc: 'Get updates' },
    { icon: ShieldCheck, label: 'Review', desc: 'Leave feedback' },
];

import AppLayout from '@/components/layout/AppLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ShoppingCart, Store, HelpCircle, User, Star, ShieldCheck, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';

const quickLinks = [
    { label: 'How to Buy', href: '/help/buying', icon: ShoppingCart },
    { label: 'How to Sell', href: '/help/selling', icon: Store },
    { label: 'Auction Rules', href: '/help/auctions', icon: Star },
    { label: 'Seller Tiers', href: '/onboarding/tiers-info', icon: TrendingUp },
    { label: 'Account & Security', href: '/help/account', icon: User },
    { label: 'Contact Support', href: 'mailto:hobbydorkapp@gmail.com', icon: HelpCircle },
];


// FAQ grouped by category for clarity
const faqCategories = [
    {
        title: 'Getting Started',
        icon: Star,
        items: [
            {
                question: 'What is HobbyDork?',
                answer: 'HobbyDork is a modern marketplace for collectibles, comics, cards, and more. We connect buyers and sellers in a safe, community-driven environment with auctions, buy-now listings, and unique features like ISO24 and Store Spotlight.'
            },
            {
                question: 'How do I create an account?',
                answer: 'Click Sign Up at the top right, enter your email, and follow the instructions. Verify your email to unlock all features.'
            },
            {
                question: 'How do I get started as a buyer?',
                answer: 'Browse listings, use the search and filters, and add items to your cart. You can also post ISO24 requests for hard-to-find items.'
            },
            {
                question: 'How do I get started as a seller?',
                answer: 'Apply to become a seller, complete onboarding, set up your store, and start listing items. See the Seller Tiers page for details on auction access and fees.'
            },
            {
                question: 'Is there a HobbyDork mobile app?',
                answer: 'Not at the moment but check back soon!'
            },
            {
                question: 'Can I use HobbyDork in other languages?',
                answer: 'Currently, HobbyDork is only available in English. We plan to add support for more languages in the future. If you need help navigating the site, contact support.'
            },
        ]
    },
    {
        title: 'Buying',
        icon: ShoppingCart,
        items: [
            {
                question: 'How do I buy items on HobbyDork?',
                answer: "1. Browse or search for items. 2. Add to cart. 3. Checkout securely with Stripe. 4. Track your order in your dashboard. 5. Leave a review after delivery.",
            },
            {
                question: 'How do I use ISO24?',
                answer: 'Go to ISO24, post what you are looking for, and wait for sellers to respond. Your request is visible for 24 hours.'
            },
            {
                question: 'How do I track my order?',
                answer: "Go to your Buyer Dashboard to see order status, tracking info, and messages from sellers. You'll get email updates for every step.",
            },
            {
                question: 'What if my item doesn’t arrive?',
                answer: "Contact the seller first via messages. If unresolved, reach out to support within 7 days of the expected delivery date. We'll help resolve the issue or refund you if needed.",
            },
            {
                question: 'Can I return or cancel an order?',
                answer: "Returns and cancellations are handled case-by-case. Contact the seller first. If you need help, contact support. See our Terms of Service for details.",
            },
            {
                question: 'How do I leave a review?',
                answer: "After your order is delivered, go to your Buyer Dashboard and click 'Leave Review' on the order. Reviews help build trust in the community.",
            },
            {
                question: 'What payment methods are accepted?',
                answer: 'All payments are processed securely through Stripe. We accept all major credit/debit cards. PayPal and Venmo are not supported.'
            },
        ],
    },
    {
        title: 'Selling & Auctions',
        icon: Store,
        items: [
            {
                question: 'How do I become a seller?',
                answer: 'Click “Apply to Become a Seller” in your dashboard or sidebar. Complete onboarding, accept the Seller Terms, and set up your store.'
            },
            {
                question: 'How do I create a listing?',
                answer: "Go to your Seller Dashboard, click 'Create Listing', and fill out the required details (title, description, price, images, shipping info). Save as draft or publish when ready.",
            },
            {
                question: 'How do I create an auction?',
                answer: "Silver/Gold sellers can create auctions from the Seller Dashboard. Fill out the auction form, pay the upfront fee, and your auction will go live after payment is confirmed.",
            },
            {
                question: 'How do seller tiers work?',
                answer: "All sellers start as Bronze (Buy Now only). Silver/Gold sellers unlock auctions and lower fees by maintaining great performance. See the Seller Tiers page for requirements and benefits.",
            },
            {
                question: 'How do I get paid as a seller?',
                answer: "Payouts are sent to your connected Stripe account after orders are delivered and the return window closes. Track payouts in your Seller Dashboard. Make sure your Stripe account is set up and verified.",
            },
            {
                question: 'How do auctions and fees work?',
                answer: "Auctions require an upfront fee (based on your tier) before going live. No backend/final value fee. See Auction Rules for details. Buy Now listings have a tier-based fee deducted at sale.",
            },
            {
                question: 'How do I upgrade my seller tier?',
                answer: "Seller tiers are upgraded automatically based on your performance (on-time shipping, order volume, and dispute rate). See Seller Tiers for requirements. You can view your current tier in your Seller Dashboard and on your store page.",
            },
            {
                question: 'How do I handle returns as a seller?',
                answer: "Work with the buyer to resolve issues. If you need help, contact support. See Seller Terms for more info. Always ship within 2 days to maintain your tier.",
            },
            {
                question: 'What is Store Spotlight?',
                answer: 'Store Spotlight is a paid feature that highlights your store on the main dashboard. Purchase a slot from your Seller Dashboard to boost visibility.'
            },
            {
                question: 'What is Blind Bidder?',
                answer: 'Blind Bidder is a special auction format where bids are hidden until the auction ends. Only Silver/Gold sellers can create blind bidder auctions.'
            },
        ],
    },
    {
        title: 'Account & Security',
        icon: User,
        items: [
            {
                question: 'How do I recover my account if I am locked out?',
                answer: [
                    'If you cannot access your account, follow these steps:',
                    '1. Go to the login page and click "Forgot Password".',
                    '2. Enter your registered email address and check your inbox for a reset link.',
                    '3. If you do not receive an email, check your spam folder or try again.',
                    '4. If you no longer have access to your email, contact support with your full name, previous email, and any order details to verify your identity.',
                    '5. For hacked or compromised accounts, change your password immediately and contact support for urgent help.',
                ].join('\n'),
            },
            {
                question: 'How do I reset my password?',
                answer: "Click 'Forgot Password' on the login page and follow the instructions sent to your email. If you have trouble, contact support for help.",
            },
            {
                question: 'How do I update my email or profile?',
                answer: "Go to your account settings to update your email, display name, or avatar. Changes take effect immediately after saving.",
            },
            {
                question: 'How do I report a user or listing?',
                answer: "Use the 'Report' button on any listing or message, or contact support with details. Reports are reviewed within 24 hours.",
            },
            {
                question: 'How do I delete my account?',
                answer: "Contact support to request account deletion. We’ll verify your identity and process your request promptly. Deleted accounts cannot be recovered.",
            },
            {
                question: 'How do I change my notification settings?',
                answer: 'Go to your account settings and adjust your notification preferences for email and in-app alerts.'
            },
            {
                question: 'What if I am suspended or limited?',
                answer: 'If your account is suspended or limited, you will see a message in your dashboard. Contact support for details and next steps.'
            },
            {
                question: 'Is HobbyDork accessible for users with disabilities?',
                answer: 'Yes. HobbyDork is designed with accessibility in mind. We support screen readers, keyboard navigation, and high-contrast modes. If you encounter any accessibility barriers, please contact support so we can assist and improve your experience.'
            },
        ],
    },
    {
        title: 'Platform Features & Rules',
        icon: TrendingUp,
        items: [
            {
                question: 'What is ISO24?',
                answer: 'ISO24 (In Search Of - 24 Hours) lets you post a request for a specific item. Your request is visible to the community for 24 hours. Sellers can respond directly.'
            },
            {
                question: 'What are the Community & Content Rules?',
                answer: "See our Community & Content Rules page for full guidelines on behavior, prohibited items, and more. Violations may result in suspension. [Read the rules](/community-rules)"
            },
            {
                question: 'What are the Seller Terms?',
                answer: "Seller Terms cover requirements for shipping, returns, communication, and more. [Read Seller Terms](/seller-terms)"
            },
            {
                question: 'What are the Auction Rules?',
                answer: "Auction Rules explain how auctions work, fees, bidding, and seller requirements. [Read Auction Rules](/help/auctions)"
            },
            {
                question: 'What is the return policy?',
                answer: 'Returns are handled case-by-case. See Terms of Service for details or contact support.'
            },
            {
                question: 'What if my listing is rejected?',
                answer: 'Listings may be rejected for violating rules or missing info. Check your email for details or contact support.'
            },
        ],
    },
    {
        title: 'Safety & Community',
        icon: ShieldCheck,
        items: [
            {
                question: 'Is HobbyDork safe?',
                answer: "We use Stripe for secure payments, require seller verification, and have strong community rules. Report any issues to support immediately. Never pay outside the platform.",
            },
            {
                question: 'How do I avoid scams?',
                answer: "Never pay outside the platform. Only communicate and pay through HobbyDork for full protection. If you suspect a scam, report it immediately."
            },
            {
                question: 'How do I block or mute users?',
                answer: "Go to the user’s profile and select 'Block' or 'Mute' to stop receiving messages or notifications from them."
            },
            {
                question: 'How do I report abuse or illegal activity?',
                answer: 'Use the Report button or contact support. We take all reports seriously and act quickly.'
            },
        ],
    },
    {
        title: 'Troubleshooting & Support',
        icon: HelpCircle,
        items: [
            {
                question: 'The site isn’t working properly. What should I do?',
                answer: [
                    'Try the following steps:',
                    '1. Refresh the page or close and reopen your browser.',
                    '2. Clear your browser cache and cookies.',
                    '3. Try a different browser (Chrome, Firefox, Safari, Edge) or device.',
                    '4. Disable browser extensions that might block scripts or cookies.',
                    '5. Make sure your browser is up to date.',
                    '6. If the problem continues, contact support with details and screenshots.'
                ].join('\n'),
            },
            {
                question: 'How do I clear my browser cache?',
                answer: [
                    'Instructions vary by browser:',
                    '- Chrome: Settings > Privacy & Security > Clear browsing data',
                    '- Firefox: Settings > Privacy & Security > Cookies and Site Data > Clear Data',
                    '- Safari: Preferences > Privacy > Manage Website Data',
                    '- Edge: Settings > Privacy, search, and services > Clear browsing data',
                    'After clearing, restart your browser and try again.'
                ].join('\n'),
            },
            {
                question: 'Does HobbyDork work on mobile devices and tablets?',
                answer: 'Yes, HobbyDork is fully responsive and works on all modern smartphones and tablets. For the best experience, use the latest version of your device’s browser.'
            },
            {
                question: 'How do I contact support?',
                answer: "Click the Contact Support button below or email hobbydorkapp@gmail.com. Our team responds within 24 hours on weekdays.",
            },
            {
                question: 'How fast will I get a response?',
                answer: "We respond to all support requests within 24 hours on weekdays (usually much faster).",
            },
            {
                question: 'What if my payment fails?',
                answer: 'Check your card details and try again. If the problem persists, contact your bank or support.'
            },
            {
                question: 'What if I have a technical issue?',
                answer: 'Try refreshing the page or using a different browser. If the issue continues, contact support with details and screenshots.'
            },
            {
                question: 'What if my account is hacked?',
                answer: 'Change your password immediately and contact support. We will help secure your account.'
            },
        ],
    },
];


export default function HelpPage() {
    const [faqSearch, setFaqSearch] = useState('');
    const handleContactClick = () => {
        window.location.href = 'mailto:hobbydorkapp@gmail.com';
    };

    // Flatten all FAQ items for search
    const allFaqItems = useMemo(() => faqCategories.flatMap(cat => cat.items.map(item => ({ ...item, category: cat.title }))), []);
    const filteredFaqItems = useMemo(() => {
        if (!faqSearch.trim()) return null;
        const q = faqSearch.toLowerCase();
        return allFaqItems.filter(item =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q) ||
            (item.category && item.category.toLowerCase().includes(q))
        );
    }, [faqSearch, allFaqItems]);

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Hero Section */}
                <div className="flex flex-col items-center text-center mb-8">
                    <HelpCircle className="h-14 w-14 text-blue-500 mb-2" />
                    <h1 className="text-4xl font-extrabold mb-2">How can we help?</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Find answers, tips, and support for buying, selling, auctions, and more on HobbyDork.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-3 p-4 rounded-lg border bg-card shadow hover:bg-blue-50 transition"
                                target={link.href.startsWith('mailto:') ? '_blank' : undefined}
                                rel={link.href.startsWith('mailto:') ? 'noopener noreferrer' : undefined}
                            >
                                <Icon className="h-6 w-6 text-blue-600" />
                                <span className="font-semibold text-base">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>


                                {/* Visual Step-by-Step: How to Buy */}
                                <div className="mb-10">
                                    <h2 className="text-xl font-bold mb-4 text-center">How to Buy on HobbyDork</h2>
                                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
                                        {buySteps.map((step, idx) => {
                                            const Icon = step.icon;
                                            return (
                                                <div key={step.label} className="flex flex-col items-center">
                                                    <div className={`rounded-full bg-blue-100 p-4 mb-2 ${idx === 0 ? 'border-2 border-blue-400' : ''}`}> <Icon className="h-8 w-8 text-blue-600" /> </div>
                                                    <span className="font-semibold text-base">{step.label}</span>
                                                    <span className="text-xs text-muted-foreground text-center">{step.desc}</span>
                                                    {idx < buySteps.length - 1 && (
                                                        <div className="hidden md:block h-1 w-12 bg-blue-200 mt-2 mb-2" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* FAQ Search Bar */}
                                <div className="mb-6 flex flex-col items-center">
                                        <input
                                                type="text"
                                                value={faqSearch}
                                                onChange={e => setFaqSearch(e.target.value)}
                                                placeholder="Search FAQs..."
                                                className="w-full max-w-xl px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                aria-label="Search FAQs"
                                        />
                                </div>

                {/* FAQ Section - Grouped by Category or Search Results */}
                <Card className="mb-10">
                    <CardHeader>
                        <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
                        <CardDescription>
                            Updated for the latest HobbyDork features and rules. Click a category to expand, or search above.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {faqSearch.trim() && filteredFaqItems ? (
                                filteredFaqItems.length > 0 ? (
                                    <Accordion type="multiple" className="w-full px-2 py-2">
                                        {filteredFaqItems.map((item, idx) => (
                                            <AccordionItem value={`search-item${idx}`} key={idx}>
                                                <AccordionTrigger className="text-base">{item.question} <span className="ml-2 text-xs text-muted-foreground">({item.category})</span></AccordionTrigger>
                                                <AccordionContent className="text-base text-muted-foreground">
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">No results found.</div>
                                )
                            ) : (
                                faqCategories.map((cat, i) => {
                                    const Icon = cat.icon;
                                    return (
                                        <div key={cat.title} className="border rounded-lg bg-muted/30">
                                            <div className="flex items-center gap-2 px-4 py-3 border-b">
                                                <Icon className="h-5 w-5 text-blue-600" />
                                                <span className="font-semibold text-lg">{cat.title}</span>
                                            </div>
                                            <Accordion type="single" collapsible className="w-full px-2 py-2">
                                                {cat.items.map((item, idx) => (
                                                    <AccordionItem value={`cat${i}-item${idx}`} key={idx}>
                                                        <AccordionTrigger className="text-base">{item.question}</AccordionTrigger>
                                                        <AccordionContent className="text-base text-muted-foreground">
                                                            {item.answer}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>


                {/* Contact Support Section */}
                <Card className="mb-10">
                    <CardHeader>
                        <CardTitle className="text-xl">Still need help?</CardTitle>
                        <CardDescription>
                            Can’t find the answer you’re looking for? Our support team is here to help.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="space-y-4 max-w-xl mx-auto"
                            onSubmit={e => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const name = (form.elements.namedItem('name') as HTMLInputElement)?.value;
                                const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
                                const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value;
                                const mailto = `mailto:hobbydorkapp@gmail.com?subject=Support Request from ${encodeURIComponent(name || 'Anonymous')}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
                                window.location.href = mailto;
                            }}
                        >
                            <div>
                                <label htmlFor="name" className="block font-semibold mb-1">Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block font-semibold mb-1">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block font-semibold mb-1">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                />
                            </div>
                            <Button type="submit" size="lg" className="w-full">
                                <Mail className="mr-2 h-5 w-5" />
                                Send Message
                            </Button>
                        </form>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            We respond within 24 hours on weekdays.
                        </p>
                    </CardContent>
                </Card>

                {/* Feedback/Feature Request Section */}
                <Card className="mb-10">
                    <CardHeader>
                        <CardTitle className="text-xl">Feature Requests & Feedback</CardTitle>
                        <CardDescription>
                            Have an idea or want to suggest a new feature? We’d love to hear from you!
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="space-y-4 max-w-xl mx-auto"
                            onSubmit={e => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const name = (form.elements.namedItem('fb_name') as HTMLInputElement)?.value;
                                const email = (form.elements.namedItem('fb_email') as HTMLInputElement)?.value;
                                const message = (form.elements.namedItem('fb_message') as HTMLTextAreaElement)?.value;
                                const mailto = `mailto:hobbydorkapp@gmail.com?subject=Feature Request/Feedback from ${encodeURIComponent(name || 'Anonymous')}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
                                window.location.href = mailto;
                            }}
                        >
                            <div>
                                <label htmlFor="fb_name" className="block font-semibold mb-1">Name</label>
                                <input
                                    id="fb_name"
                                    name="fb_name"
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="fb_email" className="block font-semibold mb-1">Email</label>
                                <input
                                    id="fb_email"
                                    name="fb_email"
                                    type="email"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="fb_message" className="block font-semibold mb-1">Your Feedback or Feature Request</label>
                                <textarea
                                    id="fb_message"
                                    name="fb_message"
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                />
                            </div>
                            <Button type="submit" size="lg" className="w-full" variant="secondary">
                                Send Feedback
                            </Button>
                        </form>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            We review all feedback and feature requests. Thank you for helping us improve HobbyDork!
                        </p>
                    </CardContent>
                </Card>

                {/* Changelog / Updates Section */}
                <Card className="mb-10">
                    <CardHeader>
                        <CardTitle className="text-xl">Changelog & Updates</CardTitle>
                        <CardDescription>
                            See what’s new and improved on HobbyDork.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <span className="font-semibold">2026-01-23:</span> Help page now features FAQ search, in-page contact and feedback forms, accessibility info, and a visual step-by-step guide.
                            </li>
                            <li>
                                <span className="font-semibold">2025-12-10:</span> Seller tier automation and auction fee enforcement launched. See Seller Tiers for details.
                            </li>
                            <li>
                                <span className="font-semibold">2025-11-01:</span> Blind Bidder auction format added for Silver/Gold sellers.
                            </li>
                            <li>
                                <span className="font-semibold">2025-10-15:</span> Store Spotlight feature launched for sellers.
                            </li>
                            <li>
                                <span className="font-semibold">2025-09-01:</span> ISO24 (In Search Of) requests now available for buyers.
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Legal & Policies */}
                <div className="max-w-2xl mx-auto py-4 space-y-2">
                    <h2 className="text-lg font-bold">Legal & Policies</h2>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link href="/terms" className="text-primary underline">
                                Terms of Service
                            </Link>
                        </li>
                        <li>
                            <Link href="/privacy" className="text-primary underline">
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link href="/community-rules" className="text-primary underline">
                                Community & Content Rules
                            </Link>
                        </li>
                        <li>
                            <Link href="/seller-terms" className="text-primary underline">
                                Seller Terms
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </AppLayout>
    );
}
