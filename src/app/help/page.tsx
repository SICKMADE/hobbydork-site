
'use client';
import AppLayout from "@/components/layout/AppLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

const faqItems = [
    {
        question: "How do I list an item?",
        answer: "To list an item, you must have an active store. From your store dashboard, you can click 'Create Listing' and fill out the required details such as title, description, price, and images. Only users with verified emails can set listings to 'Active'."
    },
    {
        question: "How do payments work?",
        answer: "All payments are processed securely through Stripe. When you proceed to checkout, you will be redirected to Stripe to complete your payment. HobbyDork does not support PayPal, Venmo, or other payment methods."
    },
    {
        question: "What is ISO24?",
        answer: "ISO24 (In Search Of - 24 Hours) allows you to post a request for a specific item you are looking for. These posts are visible to the community for 24 hours. Other users can comment or message you directly if they have the item."
    },
    {
        question: "How does the Store Spotlight work?",
        answer: "The Store Spotlight is a paid feature that highlights your store on the main dashboard. You can purchase a spotlight slot for a set duration to increase your store's visibility to the entire community."
    },
    {
        question: "How do reviews and ratings work?",
        answer: "After an order has been marked as 'Shipped' and you've received your item, you can leave a review for the seller. A review consists of a star rating (1-5) and a text comment. This helps build trust within the community."
    }
];

export default function HelpPage() {
    const handleContactClick = () => {
        window.location.href = "mailto:hobbydorkapp@gmail.com";
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Help & FAQ</CardTitle>
                        <CardDescription>
                            Find answers to common questions about using VaultVerse.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {faqItems.map((item, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger className="text-lg">{item.question}</AccordionTrigger>
                                    <AccordionContent className="text-base text-muted-foreground">
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <div className="mt-8 pt-8 border-t">
                            <h3 className="text-2xl font-semibold mb-4">Still need help?</h3>
                            <p className="text-muted-foreground mb-4">
                                If you can&apos;t find the answer you&apos;re looking for, please don&apos;t hesitate to reach out to our support team.
                            </p>
                            <Button onClick={handleContactClick}>
                                <Mail className="mr-2 h-4 w-4" />
                                Contact Support
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
                <h1 className="text-3xl font-bold">Help &amp; Legal</h1>
                <p className="text-sm text-muted-foreground">
                Basic info, rules, and legal pages for HobbyDork.
                </p>

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
                       Community &amp; Content Rules
                    </Link>
                </li>
                <li>
                     <Link href="/seller-terms" className="text-primary underline">
                       Seller Terms
                    </Link>
                </li>
                </ul>
            </div>
        </AppLayout>
    );
}
