import { Info } from 'lucide-react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function AiGradingHelpSection() {
  return (
    <AccordionItem value="ai-grading-beta">
      <AccordionTrigger className="font-bold text-lg text-left flex items-center gap-2">
        <Info className="w-5 h-5 text-accent" /> What is AI Condition Grading (Beta)?
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-900 dark:text-blue-100 font-bold mb-2">AI Condition Grading is a Beta Feature</p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li><strong>Optional for Sellers:</strong> You can choose to enable AI grading when creating a new listing. It is only available for raw (ungraded) items.</li>
            <li><strong>How it Works:</strong> Our AI analyzes your item photos and description, then provides a structured condition report, confidence score, and notes based on industry grading standards.</li>
            <li><strong>Transparency:</strong> AI notes are visible to buyers and cannot be edited by sellers. Sellers can provide feedback or dispute the AI result, which is reviewed by our moderation team.</li>
            <li><strong>Continuous Improvement:</strong> This feature is in beta. Your feedback helps us improve accuracy and fairness. All AI feedback is reviewed by staff for quality control.</li>
            <li><strong>Privacy & Control:</strong> AI grading is never required. You can opt in or out for each listing. No personal data is shared with third parties.</li>
          </ul>
          <p className="text-blue-800 dark:text-blue-200 font-medium text-xs mt-2">We are actively improving this feature. Please share your experience or report issues to help us build trust and transparency in collectible grading.</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
