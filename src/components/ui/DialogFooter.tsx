import * as React from "react";
import { DialogFooter as BaseDialogFooter } from "@/components/ui/dialog";

const DialogFooter: React.FC<React.ComponentProps<typeof BaseDialogFooter>> = (props) => (
  <BaseDialogFooter {...props} />
);

export default DialogFooter;
