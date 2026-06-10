'use client';

import React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

/**
 * Wrap your app (or root layout) with <TooltipProvider> so tooltips work.
 */
export function TooltipProvider({ children }) {
    return <RadixTooltip.Provider>{children}</RadixTooltip.Provider>;
}

// Core tooltip wrapper
export const Tooltip = RadixTooltip.Root;
// The element that triggers the tooltip (wrap your trigger element in this)
export const TooltipTrigger = RadixTooltip.Trigger;

// The content box shown when hovering
export const TooltipContent = React.forwardRef(
    ({ children, className = '', sideOffset = 4, ...props }, ref) => (
        <RadixTooltip.Portal>
            <RadixTooltip.Content
                ref={ref}
                sideOffset={sideOffset}
                className={`rounded bg-gray-800 px-2 py-1 text-white text-sm shadow-lg ${className}`}
                {...props}
            >
                {children}
                <RadixTooltip.Arrow className="fill-gray-800" />
            </RadixTooltip.Content>
        </RadixTooltip.Portal>
    )
);
TooltipContent.displayName = 'TooltipContent';