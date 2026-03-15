"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gradient-to-r from-green-500 via-zinc-200 to-red-600">
      <SliderPrimitive.Range className="absolute h-full bg-zinc-900/80 dark:bg-zinc-100/20" />
    </SliderPrimitive.Track>
    {Array.isArray(props.value) && props.value.length === 2 ? (
      <>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-white bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg cursor-pointer" />
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-white bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg cursor-pointer" />
      </>
    ) : (
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-white bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg cursor-pointer" />
    )}
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }