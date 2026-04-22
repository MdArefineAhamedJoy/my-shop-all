"use client";

import OrderDetailsSheet from "@/components/shared/OrderDetailsSheet";
import CreateOrderModal from "@/components/shared/CreateOrderModal";
import ReUseblePagination from "@/components/shared/Pagination";
import ReUsebleTable from "@/components/shared/ReUsebleTable";
import StatsCards from "@/components/shared/StatsCards";
import { Button } from "@/components/ui/button";
import ordersData from "@/data/orders.json";
import { cn } from "@/lib/utils";
import { Order } from "@/types/order";
import { OrderFormValues } from "@/lib/validations/order";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  ShoppingBag,
  Upload,
  XCircle,
} from "lucide-react";
import * as React from "react";

const data = ordersData as unknown as Order[];

export default function OrdersPage() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const handleCreateOrder = (values: OrderFormValues) => {
    // In a real app, you would call an API here
    console.log("Creating order:", values);
    toast.success("Order created successfully!");
  };

  const columns = [
    {
      header: "Order",
      accessorKey: "id",
      cell: (order: Order) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm">{order.id}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            {order.items} item{order.items > 1 ? "s" : ""}
          </span>
        </div>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customer",
      cell: (order: Order) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm">
            {order.customer}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {order.email}
          </span>
        </div>
      ),
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: (order: Order) => (
        <span className="text-sm font-black text-slate-900">{order.total}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (order: Order) => (
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            order.status === "Delivered" &&
              "bg-emerald-50 text-emerald-600 border border-emerald-100",
            order.status === "Processing" &&
              "bg-blue-50 text-blue-600 border border-blue-100",
            order.status === "Shipped" &&
              "bg-violet-50 text-violet-600 border border-violet-100",
            order.status === "Cancelled" &&
              "bg-red-50 text-red-600 border border-red-100",
          )}
        >
          {order.status}
        </span>
      ),
    },
    {
      header: "Payment",
      accessorKey: "payment",
      cell: (order: Order) => (
        <span
          className={cn(
            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
            order.payment === "Paid" ? "text-emerald-600" : "text-amber-600",
          )}
        >
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              order.payment === "Paid" ? "bg-emerald-600" : "bg-amber-600",
            )}
          />
          {order.payment}
        </span>
      ),
    },
  ];

  const actions = (order: Order) => (
    <div className="flex items-center justify-end">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg"
        onClick={() => {
          setSelectedOrder(order);
          setIsSheetOpen(true);
        }}
      >
        <Eye size={16} />
      </Button>
    </div>
  );

  // Calculations
  const totalRevenue = ordersData.reduce(
    (acc, order) => acc + (order.status !== "Cancelled" ? order.total : 0),
    0,
  );
  const pendingOrders = ordersData.filter(
    (o) => o.status === "Pending" || o.status === "Processing",
  ).length;
  const pendingAmount = ordersData
    .filter((o) => o.status === "Pending" || o.status === "Processing")
    .reduce((acc, order) => acc + order.total, 0);
  const completedOrders = ordersData.filter(
    (o) => o.status === "Delivered",
  ).length;
  const cancelledOrders = ordersData.filter(
    (o) => o.status === "Cancelled",
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Orders
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Track and manage customer orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-sm font-bold px-6 shadow-sm cursor-pointer"
          >
            <Download size={18} className="mr-2" /> Export Orders
          </Button>
          <Button
            variant="outline"
            className="rounded-sm font-bold px-6 shadow-sm cursor-pointer"
          >
            <Upload size={18} className="mr-2" /> Import Orders
          </Button>
          <Button 
            className="rounded-sm font-bold px-6 shadow-sm cursor-pointer"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <ShoppingBag size={18} className="mr-2" /> Create Order
          </Button>
        </div>
      </div>

      {/* Order Stats */}
      <StatsCards
        stats={[
          {
            label: "Total Revenue",
            value: totalRevenue.toLocaleString(),
            unit: "TK",
            icon: ShoppingBag,
            color: "text-blue-500",
            bg: "bg-blue-50",
            accent: "bg-blue-500",
            sub: `${ordersData.length} Total Orders`,
          },
          {
            label: "Pending",
            value: pendingOrders,
            unit: "Orders",
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-50",
            accent: "bg-amber-500",
            sub: `${pendingAmount.toLocaleString()} TK Expected`,
          },
          {
            label: "Completed",
            value: completedOrders,
            unit: "Orders",
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
            accent: "bg-emerald-500",
            sub: "Successfully Delivered",
          },
          {
            label: "Cancelled",
            value: cancelledOrders,
            unit: "Orders",
            icon: XCircle,
            color: "text-red-500",
            bg: "bg-red-50",
            accent: "bg-red-500",
            sub: "Lost Revenue",
          },
        ]}
      />

      <div className="space-y-0 shadow-none border border-slate-100 rounded-none overflow-hidden">
        <ReUsebleTable
          data={data}
          columns={columns}
          actions={actions}
        />
        <ReUseblePagination
          currentPage={currentPage}
          totalPages={5}
          onPageChange={setCurrentPage}
        />
      </div>

      <OrderDetailsSheet
        order={selectedOrder}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />

      <CreateOrderModal 
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateOrder}
      />
    </div>
  );
}
