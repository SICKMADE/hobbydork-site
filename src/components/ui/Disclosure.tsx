'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

/**
 * A simplified Disclosure component using Radix Collapsible 
 * to avoid external Headless UI dependencies.
 */
export const Disclosure = ({ children }: { children: (props: { open: boolean }) => React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <CollapsiblePrimitive.Root open={open} onOpenChange={setOpen}>
      {children({ open })}
    </CollapsiblePrimitive.Root>
  );
};

Disclosure.Panel = CollapsiblePrimitive.Content;
