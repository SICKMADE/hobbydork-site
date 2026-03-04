'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const legalSections = [
  {
    id: 'terms-of-service',
    title: '1. TERMS OF SERVICE',
    content: `
1.1 ACCEPTANCE OF TERMS
By accessing and using the hobbydork platform and services (the "Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and all applicable federal, state, and local laws and regulations. If you do not agree to these Terms, you may not use the Platform.

1.2 PLATFORM DESCRIPTION
hobbydork operates as a social marketplace facilitating peer-to-peer transactions for collectible items, including but not limited to trading cards, comics, watches, vintage items, and related collectibles. hobbydork is a platform provider and marketplace intermediary, not a direct buyer or seller of items. All transactions occur between registered users (buyers and sellers), and hobbydork is not a party to such transactions except as explicitly stated herein.

1.3 ELIGIBILITY
You represent and warrant that: (a) you are at least 18 years of age and possess legal capacity to enter into binding contracts; (b) accessing and using the Platform does not violate any law or regulation applicable to you; (c) you have not been previously banned from the Platform; and (d) all information provided during registration is accurate, current, and complete.

1.4 USER ACCOUNTS
Users are responsible for maintaining the confidentiality of login credentials and all activities conducted under their account. hobbydork is not liable for unauthorized access resulting from user negligence. Users agree to notify hobbydork immediately of any unauthorized account access. Each account is personal and non-transferable.
    `,
  },
  {
    id: 'shipping-policy',
    title: '2. TWO-DAY SHIPPING POLICY & ENFORCEMENT',
    content: `
2.1 MANDATORY SHIPPING REQUIREMENT
All sellers agree that every item listed for sale on the Platform must be received by a common carrier (USPS, UPS, FedEx, or equivalent) within two (2) business days, excluding weekends and federal holidays, following payment confirmation. This is a material term of the seller agreement and violation results in automatic enforcement mechanisms.

2.2 DEFINITION OF "RECEIVED BY CARRIER"
"Received by carrier" means the date and time the carrier scans package acceptance at their facility. Creating a shipping label, scheduling pickup, or dropping a package in a mailbox does not satisfy this requirement. Seller must provide carrier proof of acceptance.

2.3 LATE SHIPMENT CONSEQUENCES
Sellers who fail to meet the 2-day shipping requirement acknowledge and accept the following automatic consequences:
   (a) Buyers may cancel orders with one-click and receive automatic full refunds
   (b) Seller tier downgrade (loss of all tier benefits and fee reductions)
   (c) Increased seller fees on all subsequent listings (tier reset to Tier 1)
   (d) Public reputation record impact (visible to all marketplace users)
   (e) Potential account suspension after repeated violations
   (f) Ineligibility for seller protection features

This policy is enforced with ZERO TOLERANCE and applies uniformly to all sellers.

2.4 BUYER CANCELLATION RIGHTS
Buyers are automatically granted the right to cancel any order and receive a full refund if the seller has not provided carrier acceptance proof within two (2) business days of payment. No merchant objection or negotiation is permitted. Refunds are processed immediately upon cancellation.

2.5 SHIPPING COST RESPONSIBILITY
Sellers are responsible for all shipping costs. The Platform does not subsidize or reimburse shipping expenses. Sellers must factor shipping costs into their pricing strategy.
    `,
  },
  {
    id: 'condition-disclaimers',
    title: '3. CONDITION & GRADING DISCLAIMERS',
    content: `
3.1 RAW vs. GRADED ITEMS
hobbydork recognizes two categories of item conditions:
   (a) RAW (UNGRADED): Items not certified by professional grading companies
   (b) GRADED: Items certified by recognized grading companies (PSA, CGC, BGS, Sportscard Guaranty, etc.)

3.2 RAW ITEM DISCLAIMER
Buyers purchasing raw (ungraded) items acknowledge and accept that:
   (a) No official condition certification exists
   (b) Condition is subjective and variable
   (c) Raw items 9 out of 10 times contain imperfections (micro scratches, wear, centering issues, etc.)
   (d) Buyer accepts full responsibility for condition assessment
   (e) No returns are permitted based on condition
   (f) Buyer should inspect seller photos carefully and message seller with specific condition questions before purchase

3.3 GRADED ITEM GUARANTEE
Graded items include professional certification guaranteeing grade at point of grading. Grading companies' standards and grade certifications are the sole condition representation. hobbydork does not verify or guarantee grading company certifications; buyers accept grades as certified by the grading company.

3.4 CONDITION RISK ALLOCATION
Buyer assumes all risk related to condition after purchase completion. Seller is not liable for buyer dissatisfaction with condition (raw items) or for grade accuracy (graded items certified by third parties).

3.5 MISREPRESENTATION DISPUTES
If a buyer believes an item's condition materially mismatches the description provided by seller, buyer must notify seller within 7 days with photographic evidence. hobbydork will mediate disputes but reserves the right to determine materiality of misrepresentation. Refunds are discretionary and based on hobbydork's review.
    `,
  },
  {
    id: 'payment-processing',
    title: '4. PAYMENT PROCESSING & TRANSACTION MECHANICS',
    content: `
4.1 PAYMENT METHOD
The Platform processes payments exclusively through Stripe, Inc. All transactions are subject to Stripe's Terms of Service and Payment Processing Agreement. hobbydork does not store or process credit card information directly; all payment data is encrypted and handled by Stripe's PCI-DSS compliant systems.

4.2 PAYMENT CONFIRMATION
Payment confirmation constitutes the date and time when Stripe processes the transaction successfully. Seller's 2-day shipping clock begins at this moment. Pending or failed payments do not trigger the shipping requirement.

4.3 PRICE & AVAILABILITY
All prices are in USD unless otherwise stated. hobbydork reserves the right to cancel transactions if pricing errors are discovered. Sellers warrant that items are in their inventory and available as described at time of sale. If an item becomes unavailable after purchase, seller must notify buyer immediately and full refund must be issued.

4.4 FEES & COMMISSIONS
hobbydork charges seller transaction fees (Tier 1: 8%, Tier 2: 6%, Tier 3: 4%) plus payment processing fees (2.9% + $0.30 per transaction). Tier placement is determined by shipping compliance, rating history, and sales volume. Fees are automatically deducted from seller payouts.

4.5 SELLER PAYOUTS
Seller payouts are processed weekly via ACH transfer to verified bank account. Seller warrants that all banking information is accurate. hobbydork is not liable for misdirected funds due to incorrect account information provided by seller.
    `,
  },
  {
    id: 'seller-responsibilities',
    title: '5. SELLER RESPONSIBILITIES & WARRANTIES',
    content: `
5.1 ITEM AUTHENTICITY WARRANTY
Sellers represent and warrant that all items listed are authentic, legal to sell, and not counterfeit, stolen, prohibited, or infringing. Sellers assume full liability for any authenticity disputes. hobbydork does not authenticate items and disclaims responsibility for authenticity disputes.

5.2 LEGAL COMPLIANCE
Sellers warrant that: (a) items comply with all applicable federal, state, and local laws; (b) items are not subject to export restrictions; (c) sales do not violate any intellectual property rights; and (d) seller has legal authority to sell the item.

5.3 PROHIBITED ITEMS
The following items are prohibited and result in automatic account suspension: weapons, explosives, hazardous materials, controlled substances, counterfeit goods, stolen property, animal products (endangered species), and items that infringe intellectual property rights.

5.4 ACCURATE DESCRIPTIONS & PHOTOS
Sellers agree to provide accurate, complete descriptions and representative photographs. Descriptions must include condition assessment, all defects, grading information (if applicable), and material facts that would affect buyer decision-making. Misleading descriptions may result in account suspension.

5.5 SELLER TIER SYSTEM
Tier placement is automatically calculated based on:
   - Tier 1 (8% fees): 0% late shipment rate
   - Tier 2 (6% fees): <5% late shipment rate + 50+ completed orders + 4.5+ average rating
   - Tier 3 (4% fees): <2% late shipment rate + 200+ completed orders + 4.7+ average rating

Tier status is recalculated monthly. Violation of 2-day shipping requirement immediately downgrades seller to Tier 1.
    `,
  },
  {
    id: 'buyer-responsibilities',
    title: '6. BUYER RESPONSIBILITIES & ASSUMPTIONS',
    content: `
6.1 DILIGENT INSPECTION
Buyers agree to: (a) inspect seller photos thoroughly; (b) message sellers with specific condition/grading questions before purchase; (c) review return policies; and (d) understand the distinction between raw and graded items.

6.2 AS-IS PURCHASES
All items are sold on an "as-is" basis. Except where expressly guaranteed by this Terms (2-day shipping, late cancellation right), hobbydork and sellers make no warranties regarding condition, merchantability, fitness for purpose, or non-infringement.

6.3 BUYER PAYMENT OBLIGATION
By completing checkout, buyer unconditionally agrees to pay the quoted amount and acknowledges receipt of payment receipt/confirmation. Payment disputes with Stripe must be resolved through Stripe's chargeback process, not through hobbydork.

6.4 ASSUMPTION OF RISK
Buyers assume all risk of loss, damage, and fluctuation in item value after purchase. hobbydork is not liable for market price changes, item value depreciation, or buyer's failure to sell item subsequently.
    `,
  },
  {
    id: 'moderation-enforcement',
    title: '7. MODERATION, REPORTING & ENFORCEMENT',
    content: `
7.1 COMMUNITY REPORTING
Users may report listings, sellers, or conduct they believe violates these Terms by clicking the "Report" button. Reports trigger hobbydork review and investigation.

7.2 MODERATION STANDARDS
hobbydork moderators review reports and may:
   (a) Remove listings or comments
   (b) Suspend or permanently ban user accounts
   (c) Remove seller verification status
   (d) Initiate refunds
   (e) Report suspected illegal activity to law enforcement

7.3 MODERATION IS DISCRETIONARY
hobbydork's moderation decisions are discretionary and final. hobbydork does not provide appeals processes for moderation decisions. Users bear sole responsibility for compliance with Terms.

7.4 NO OBLIGATION TO MODERATE
While hobbydork may monitor the Platform, hobbydork has no obligation to proactively monitor all user conduct, listings, or communications. hobbydork acts as a passive intermediary and is not responsible for user-generated content except where it exercises discretionary moderation.

7.5 ACCOUNT TERMINATION
hobbydork reserves the right to terminate any account immediately and without notice for: (a) violation of these Terms; (b) payment fraud or chargeback disputes; (c) repeated violations; (d) reasonable suspicion of illegal conduct; or (e) any reason in hobbydork's sole discretion.
    `,
  },
  {
    id: 'limitation-liability',
    title: '8. DISCLAIMER OF WARRANTIES & LIMITATION OF LIABILITY',
    content: `
8.1 DISCLAIMER OF WARRANTIES
THE PLATFORM IS PROVIDED "AS-IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. hobbydork DISCLAIMS ALL WARRANTIES INCLUDING: (A) MERCHANTABILITY; (B) FITNESS FOR A PARTICULAR PURPOSE; (C) NON-INFRINGEMENT; (D) TITLE; AND (E) THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR VIRUS-FREE.

hobbydork DOES NOT WARRANT:
   - Item authenticity, condition, grading accuracy, or value
   - Seller identity, reputation, or trustworthiness
   - Buyer satisfaction with purchases
   - That disputes will be resolved in buyer or seller favor
   - Payment processing success or security beyond Stripe's capabilities

8.2 LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, hobbydork'S TOTAL LIABILITY FOR ANY CLAIM ARISING FROM USE OF THE PLATFORM SHALL NOT EXCEED the amount paid by user to hobbydork in the 12 months preceding the claim (OR $100 IF NO PAYMENT WAS MADE).

IN NO EVENT SHALL hobbydork BE LIABLE FOR:
   - Indirect, incidental, consequential, special, or punitive damages
   - Lost profits, revenue, data, or business
   - Inability to access the Platform
   - Third-party conduct or transactions
   - Item loss, damage, or theft in transit
   - Payment fraud or unauthorized transactions
   - Disputes between users

SOME JURISDICTIONS DO NOT ALLOW LIMITATION OF LIABILITY, SO THIS LIMITATION MAY NOT APPLY TO YOU.

8.3 INDEMNIFICATION
Users agree to indemnify, defend, and hold harmless hobbydork and its officers, directors, employees, and agents from any claim, liability, or expense (including attorney fees) arising from: (a) user's violation of these Terms; (b) user's violation of law; (c) user's conduct on the Platform; or (d) user's transactions with other users.
    `,
  },
  {
    id: 'privacy-security',
    title: '9. PRIVACY & DATA SECURITY',
    content: `
9.1 DATA COLLECTION
hobbydork collects user information (name, email, address, payment info) to facilitate transactions. This data may be shared with payment processors, shipping carriers, and law enforcement as legally required.

9.2 THIRD-PARTY SERVICES
hobbydork uses third-party services (Stripe for payments, Firebase for data storage, Google Analytics for metrics). Users accept these third parties' terms and privacy policies.

9.3 DATA BREACH NOTIFICATION
In the event of confirmed unauthorized access to user data, hobbydork will notify affected users within 30 days or as required by law. hobbydork's liability for data breaches is limited to Section 8.2 above.

9.4 NO GUARANTEE OF SECURITY
While hobbydork employs industry-standard security measures, no system is 100% secure. Users acknowledge the inherent risks of internet-based transactions.
    `,
  },
  {
    id: 'dispute-resolution',
    title: '10. DISPUTE RESOLUTION & GOVERNING LAW',
    content: `
10.1 INFORMAL RESOLUTION
Users agree to first attempt informal resolution of disputes by contacting the other party directly through the Platform's messaging system within 14 days of the dispute arising.

10.2 MEDIATION
If informal resolution fails, parties agree to submit disputes to non-binding mediation before pursuing litigation. Each party bears its own costs; mediation costs are split equally.

10.3 GOVERNING LAW
These Terms and all disputes arising from Platform use are governed by the laws of the State of Nevada, without regard to conflict-of-law principles. The parties irrevocably consent to exclusive jurisdiction in the state and federal courts located in Clark County, Nevada.

10.4 LIMITATION ON CLAIMS
Any legal action or proceeding must be commenced within one (1) year of the claim arising, or the claim is forever barred.

10.5 WAIVER OF JURY TRIAL
Users waive the right to trial by jury in any dispute with hobbydork.

10.6 SEVERABILITY
If any provision of these Terms is found unenforceable, such provision is reformed to the minimum extent necessary to make it enforceable, and all other provisions remain in full force.
    `,
  },
  {
    id: 'intellectual-property',
    title: '11. INTELLECTUAL PROPERTY RIGHTS',
    content: `
11.1 PLATFORM IP OWNERSHIP
hobbydork retains all intellectual property rights in the Platform, including software, design, logos, trademarks, and content. Users are licensed to use the Platform solely for personal, non-commercial purposes.

11.2 USER-GENERATED CONTENT
By uploading photos, descriptions, or other content to the Platform, users grant hobbydork a non-exclusive, worldwide, royalty-free license to use, display, modify, and reproduce such content for Platform operation, marketing, and improvement purposes.

11.3 THIRD-PARTY IP
Users warrant that all content they upload does not infringe third-party intellectual property rights. Users assume liability for IP infringement claims.

11.4 DMCA COMPLIANCE
hobbydork complies with the Digital Millennium Copyright Act (DMCA). Users may submit DMCA takedown notices for infringing content. Repeat infringers will have their accounts terminated.
    `,
  },
  {
    id: 'changes-modifications',
    title: '12. CHANGES & MODIFICATIONS',
    content: `
12.1 PLATFORM MODIFICATIONS
hobbydork reserves the right to modify, suspend, or discontinue the Platform (or any part thereof) at any time with or without notice. hobbydork is not liable for any modification, suspension, or discontinuation.

12.2 TERMS MODIFICATIONS
hobbydork may modify these Terms at any time by posting updated Terms to the Platform. Continued use of the Platform constitutes acceptance of modified Terms. Users are responsible for reviewing Terms periodically.

12.3 NO WAIVER
Failure to enforce any Term does not waive that Term or any other provision.
    `,
  },
  {
    id: 'contact',
    title: '13. CONTACT & NOTICES',
    content: `
13.1 LEGAL NOTICES
Legal notices to hobbydork should be sent to: [LEGAL NAME], [ADDRESS], Attn: Legal Department

Legal notices to users are effective when posted to the Platform or emailed to the address associated with the user account.

13.2 SUPPORT CONTACT
For non-legal matters, users may contact support@hobbydork.com

13.3 EFFECTIVE DATE
These Terms are effective as of March 1, 2026, and supersede all prior agreements.

13.4 ENTIRE AGREEMENT
These Terms, together with the Privacy Policy and any other policies posted on the Platform, constitute the entire agreement between users and hobbydork regarding Platform use and supersede all prior understandings.

---

DISCLAIMER: This Terms of Service is provided for illustrative purposes and does not constitute legal advice. Actual legal documents should be reviewed by licensed attorneys in your jurisdiction. Laws vary significantly by location.
    `,
  },
];

export default function LegalPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('terms-of-service');

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tight mb-4">
            Legal Terms & Conditions
          </h1>
          <div className="bg-red-50 border-2 border-red-300 p-6 rounded-xl">
            <p className="text-sm font-bold text-red-900">
              ⚖️ <span className="font-black">IMPORTANT:</span> These terms govern all use of hobbydork. By using this Platform, you accept all terms below. If you do not agree, do not use hobbydork.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8 sticky top-0 bg-background/95 backdrop-blur z-10 pb-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Quick Navigation</p>
          <div className="flex flex-wrap gap-2">
            {legalSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setExpandedSection(section.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all',
                  expandedSection === section.id
                    ? 'bg-accent text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {section.title.split('.')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {legalSections.map((section) => (
            <Card key={section.id} className="overflow-hidden border">
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-muted/50 transition-colors text-left border-b"
              >
                <h2 className="font-black text-primary text-sm md:text-base">{section.title}</h2>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-accent transition-transform flex-shrink-0',
                    expandedSection === section.id && 'rotate-180'
                  )}
                />
              </button>

              {expandedSection === section.id && (
                <div className="px-6 py-6 bg-muted/20 prose prose-sm dark:prose-invert max-w-none">
                  {section.content.split('\n').map((paragraph, idx) => {
                    if (paragraph.trim().startsWith('(a)') || paragraph.trim().startsWith('(b)') ||
                        paragraph.trim().startsWith('(c)') || paragraph.trim().startsWith('(d)') ||
                        paragraph.trim().startsWith('(e)') || paragraph.trim().startsWith('(f)')) {
                      return (
                        <div key={idx} className="pl-6 text-sm font-medium text-muted-foreground leading-relaxed">
                          {paragraph}
                        </div>
                      );
                    }
                    if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                      return (
                        <div key={idx} className="pl-6 text-sm font-medium text-muted-foreground leading-relaxed">
                          {paragraph}
                        </div>
                      );
                    }
                    if (!paragraph.trim()) return null;
                    return (
                      <p key={idx} className="text-sm font-medium text-muted-foreground leading-relaxed mb-3">
                        {paragraph.trim()}
                      </p>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 p-8 bg-muted rounded-xl border-2 border-border space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Important Disclaimers
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground font-medium">
            <li>• These terms are binding legal agreements. Violation may result in account termination and legal action.</li>
            <li>• hobbydork is not liable for transactions between users or third-party conduct.</li>
            <li>• Users assume all risk related to item condition, authenticity, and value.</li>
            <li>• The 2-day shipping policy is enforced with zero tolerance and automatically triggers seller penalties.</li>
            <li>• This document was last updated March 1, 2026. Check back for updates.</li>
          </ul>
          <div className="pt-4 border-t space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/legal-hub">Back to Legal Hub</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/help">Back to Help Center</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
