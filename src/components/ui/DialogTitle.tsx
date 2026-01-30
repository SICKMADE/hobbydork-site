import * as React from "react";
import { DialogTitle as BaseDialogTitle } from "@/components/ui/dialog";

const DialogTitle: React.FC<React.ComponentProps<typeof BaseDialogTitle>> = (props) => (
  <BaseDialogTitle {...props} />
);

export default DialogTitle;
