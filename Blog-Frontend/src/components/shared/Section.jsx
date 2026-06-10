import React from "react";
import { cn } from "@/lib/utils";

export const Section = ({
  as: As = "section",
  className,
  children,
  size = "default",
  ...props
}) => {
  const sizes = {
    sm: "py-10 md:py-14",
    default: "py-16 md:py-24",
    lg: "py-20 md:py-32",
  };
  return (
    <As className={cn(sizes[size], className)} {...props}>
      {children}
    </As>
  );
};

export default Section;
