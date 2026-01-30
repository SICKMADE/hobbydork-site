import * as React from "react";
import { DialogContent as BaseDialogContent } from "@/components/ui/dialog";

const DialogContent: React.FC<React.ComponentProps<typeof BaseDialogContent>> = (props) => (
  <BaseDialogContent {...props} />
);

export default DialogContent;
