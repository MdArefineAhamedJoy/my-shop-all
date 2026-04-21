"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReUseableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] h-[95vh]",
};

export default function ReUseableModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ReUseableModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "overflow-hidden flex flex-col p-0 border-none shadow-2xl",
          sizeClasses[size],
          className
        )}
      >
        <DialogHeader className="p-6 pb-4 text-left border-b border-slate-50">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-slate-500 font-medium">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">
          {children}
        </div>

        {footer !== undefined && (
          <DialogFooter className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center gap-3">
            {footer || (
              <>
                <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-500">
                  Cancel
                </Button>
                <Button variant="default" onClick={onClose} className="rounded-xl font-bold px-6">
                  Confirm
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
