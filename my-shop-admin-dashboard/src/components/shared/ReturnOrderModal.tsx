"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Order } from "@/types/order";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ReturnOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, reason: string, status: string) => void;
}

export default function ReturnOrderModal({
  order,
  isOpen,
  onOpenChange,
  onSubmit,
}: ReturnOrderModalProps) {
  const [reason, setReason] = React.useState("");
  const [status, setStatus] = React.useState("Returned");

  const handleSubmit = () => {
    if (order && reason) {
      onSubmit(order.id, reason, status);
      setReason("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <RotateCcw size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Process Return</DialogTitle>
              <DialogDescription>Order #{order?.id}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Return Reason</label>
            <Textarea 
              placeholder="Why is this product being returned?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all resize-none font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Update Status To</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="Returned" className="font-bold text-amber-600">Returned</SelectItem>
                <SelectItem value="Refunded" className="font-bold text-emerald-600">Refunded</SelectItem>
                <SelectItem value="Cancelled" className="font-bold text-red-600">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3">
            <AlertCircle className="text-blue-500 shrink-0" size={18} />
            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
              Marking this order as <b>Returned</b> will update the inventory and move this order to the Returns section.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button 
            variant="premium" 
            onClick={handleSubmit} 
            disabled={!reason}
            className="rounded-xl font-bold px-8 shadow-slate-200"
          >
            Confirm Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
