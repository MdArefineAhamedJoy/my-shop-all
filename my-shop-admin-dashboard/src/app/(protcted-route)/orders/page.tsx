"use client";

import CreateOrderModal from "@/components/shared/CreateOrderModal";
import EditOrderModal from "@/components/shared/EditOrderModal";
import ReturnOrderModal from "@/components/shared/ReturnOrderModal";
import OrderDetailsSheet from "@/components/shared/OrderDetailsSheet";
import ReUseblePagination from "@/components/shared/Pagination";
import ReUsebleTable from "@/components/shared/ReUsebleTable";
import StatsCards from "@/components/shared/StatsCards";
import { Button } from "@/components/ui/button";
import ordersData from "@/data/orders.json";
import { cn } from "@/lib/utils";
import { OrderFormValues } from "@/lib/validations/order";
import { Order } from "@/types/order";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Edit,
  RotateCcw,
  ShoppingBag,
  Upload,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const data = ordersData as unknown as Order[];

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>(
    ordersData as unknown as Order[],
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = React.useState(false);

  const handleCreateOrder = (values: OrderFormValues) => {
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      customer: values.customerName,
      email: values.email,
      total: values.total,
      status: "Processing",
      payment: "Paid",
      date: new Date().toISOString(),
      items: values.items.length,
    };
    setOrders([newOrder, ...orders]);
    setIsCreateModalOpen(false);
    toast.success("Order created successfully!");
  };

  const handleStatusUpdate = (id: string, status: string) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order)),
    );
    toast.success(`Order #${id} status updated to ${status}`);
    setIsSheetOpen(false);
  };

  const handleEditOrder = (id: string, values: any) => {
    setOrders((prev) => 
      prev.map((order) => order.id === id ? { ...order, ...values } : order)
    );
    toast.success(`Order #${id} updated successfully!`);
    setIsEditModalOpen(false);
    setSelectedOrder(null);
  };

  const handleReturnOrder = (id: string, reason: string, status: string) => {
    setOrders((prev) => 
      prev.map((order) => order.id === id ? { ...order, status, returnReason: reason } : order)
    );
    toast.success(`Order #${id} marked as ${status}`);
    setIsReturnModalOpen(false);
    setSelectedOrder(null);
  };

  // ... columns and actions remain the same, just use orders state

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
    <div className="flex items-center justify-end gap-1">
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
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg"
        onClick={() => {
          setSelectedOrder(order);
          setIsEditModalOpen(true);
        }}
      >
        <Edit size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-amber-600 rounded-lg"
        title="Mark as Returned"
        onClick={() => {
          setSelectedOrder(order);
          setIsReturnModalOpen(true);
        }}
      >
        <RotateCcw size={16} />
      </Button>
    </div>
  );

  // Calculations
  const totalRevenue = orders.reduce(
    (acc, order) => acc + (order.status !== "Cancelled" ? order.total : 0),
    0,
  );
  const pendingOrders = orders.filter(
    (o) => o.status === "Pending" || o.status === "Processing",
  ).length;
  const pendingAmount = orders
    .filter((o) => o.status === "Pending" || o.status === "Processing")
    .reduce((acc, order) => acc + order.total, 0);
  const completedOrders = orders.filter((o) => o.status === "Delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled").length;

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
            sub: `${orders.length} Total Orders`,
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
        <ReUsebleTable data={orders} columns={columns} actions={actions} />
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
        onStatusUpdate={handleStatusUpdate}
      />

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateOrder}
      />

      <EditOrderModal 
        order={selectedOrder}
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleEditOrder}
      />

      <ReturnOrderModal 
        order={selectedOrder}
        isOpen={isReturnModalOpen}
        onOpenChange={setIsReturnModalOpen}
        onSubmit={handleReturnOrder}
      />
    </div>
  );
}
