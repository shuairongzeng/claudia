/**
 * Sticky Tabs Component
 * A wrapper around the regular Tabs component that makes the TabsList sticky
 * when scrolling through long content.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";

export interface StickyTabsProps {
  /**
   * The controlled value of the tab to activate
   */
  value: string;
  /**
   * Event handler called when the value changes
   */
  onValueChange: (value: string) => void;
  /**
   * The tabs and their content
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes for the root container
   */
  className?: string;
  /**
   * Additional CSS classes for the sticky tabs list
   */
  tabsListClassName?: string;
  /**
   * Additional CSS classes for the content container
   */
  contentClassName?: string;
  /**
   * Distance from top when sticky (default: 0)
   */
  stickyTop?: number;
  /**
   * Z-index for the sticky tabs (default: 10)
   */
  zIndex?: number;
}

/**
 * Sticky Tabs component that keeps the TabsList visible while scrolling
 * 
 * @example
 * <StickyTabs value={activeTab} onValueChange={setActiveTab}>
 *   <StickyTabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </StickyTabsList>
 *   <StickyTabsContent value="tab1">Content 1</StickyTabsContent>
 *   <StickyTabsContent value="tab2">Content 2</StickyTabsContent>
 * </StickyTabs>
 */
export const StickyTabs: React.FC<StickyTabsProps> = ({
  value,
  onValueChange,
  children,
  className,
  tabsListClassName,
  contentClassName,
  stickyTop = 0,
  zIndex = 10,
}) => {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs value={value} onValueChange={onValueChange} className="flex flex-col h-full">
        {/* Extract TabsList and make it sticky */}
        <div 
          className={cn(
            "sticky bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40",
            tabsListClassName
          )}
          style={{ 
            top: `${stickyTop}px`,
            zIndex: zIndex
          }}
        >
          {/* Find and render TabsList children */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === StickyTabsList) {
              return child;
            }
            return null;
          })}
        </div>

        {/* Content area */}
        <div className={cn("flex-1 overflow-y-auto", contentClassName)}>
          {/* Find and render TabsContent children */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === StickyTabsContent) {
              return child;
            }
            return null;
          })}
        </div>
      </Tabs>
    </div>
  );
};

export interface StickyTabsListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Sticky TabsList component - use this instead of regular TabsList
 */
export const StickyTabsList: React.FC<StickyTabsListProps> = ({
  children,
  className,
}) => {
  return (
    <TabsList className={cn("mb-0", className)}>
      {children}
    </TabsList>
  );
};

export interface StickyTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Sticky TabsContent component - use this instead of regular TabsContent
 */
export const StickyTabsContent: React.FC<StickyTabsContentProps> = ({
  value,
  children,
  className,
}) => {
  return (
    <TabsContent value={value} className={cn("mt-0 p-6", className)}>
      {children}
    </TabsContent>
  );
};

// Re-export TabsTrigger for convenience
export { TabsTrigger } from "@/components/ui/tabs";

// Default export
export default StickyTabs;
