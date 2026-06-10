import React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "max-w-3xl",
  prose: "max-w-3xl",
  default: "max-w-7xl",
  lg: "max-w-screen-2xl",
  full: "max-w-none",
};

export const Container = ({
  as: As = "div",
  size = "default",
  className,
  children,
  ...props
}) => (
  <As
    className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)}
    {...props}
  >
    {children}
  </As>
);

export default Container;
