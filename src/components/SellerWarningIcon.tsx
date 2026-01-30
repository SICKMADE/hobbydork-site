import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function SellerWarningIcon() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center ml-1 text-red-600" title="This seller has overdue shipments. Proceed with caution.">
          <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs text-red-700 font-bold">This seller has overdue shipments. Proceed with caution.</span>
      </TooltipContent>
    </Tooltip>
  );
}
