import * as React from "react";
import { CardHeader as BaseCardHeader } from "@/components/ui/card";

const CardHeader: React.FC<React.ComponentProps<typeof BaseCardHeader>> = (props) => (
  <BaseCardHeader {...props} />
);

export default CardHeader;
