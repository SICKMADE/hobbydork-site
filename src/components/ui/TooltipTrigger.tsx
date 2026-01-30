import * as React from "react";
import { TooltipTrigger as BaseTooltipTrigger } from "@/components/ui/tooltip";

const TooltipTrigger: React.FC<React.ComponentProps<typeof BaseTooltipTrigger>> = (props) => (
  <BaseTooltipTrigger {...props} />
);

export default TooltipTrigger;
