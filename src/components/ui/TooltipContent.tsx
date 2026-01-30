import * as React from "react";
import { TooltipContent as BaseTooltipContent } from "@/components/ui/tooltip";

const TooltipContent: React.FC<React.ComponentProps<typeof BaseTooltipContent>> = (props) => (
  <BaseTooltipContent {...props} />
);

export default TooltipContent;
