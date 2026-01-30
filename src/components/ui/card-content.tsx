import * as React from "react";
import { CardContent as BaseCardContent } from "@/components/ui/card";

const CardContent: React.FC<React.ComponentProps<typeof BaseCardContent>> = (props) => (
  <BaseCardContent {...props} />
);

export default CardContent;
