import * as React from "react";
import { CardTitle as BaseCardTitle } from "@/components/ui/card";

const CardTitle: React.FC<React.ComponentProps<typeof BaseCardTitle>> = (props) => (
  <BaseCardTitle {...props} />
);

export default CardTitle;
