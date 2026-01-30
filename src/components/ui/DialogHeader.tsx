import * as React from "react";
import { DialogHeader as BaseDialogHeader } from "@/components/ui/dialog";

const DialogHeader: React.FC<React.ComponentProps<typeof BaseDialogHeader>> = (props) => (
  <BaseDialogHeader {...props} />
);

export default DialogHeader;
