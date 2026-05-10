"use client";

import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFakeData } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const data = getFakeData();

export default function MyDashboard() {
  const stats = data.stats.map(s => ({
    ...s,
    icon: s.icon === "DollarSign" ? DollarSign : 
          s.icon === "ShoppingBag" ? ShoppingBag : 
          s.icon === "Users" ? Users : TrendingUp
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 font-medium text-sm">Welcome back! Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl">Download Report</Button>
          <Button variant="premium" className="rounded-xl shadow-slate-200">
            <Plus size={18} className="mr-2" /> Create Order
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={stat.name} className={cn(
            "group cursor-pointer border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
            i === 0 && "bg-slate-900 text-white hover:shadow-slate-200"
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  i === 0 ? "bg-white/10 text-white" : stat.bg + " " + stat.color
                )}>
                  <stat.icon size={22} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                  stat.trend === "up" 
                    ? (i === 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-50 text-emerald-600") 
                    : (i === 0 ? "bg-red-500/20 text-red-300" : "bg-red-50 text-red-600")
                )}>
                  {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", i === 0 ? "text-slate-400" : "text-slate-500")}>
                  {stat.name}
                </p>
                <p className="text-2xl font-black">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <Card className="xl:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-5">
            <div>
              <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
              <CardDescription>A list of the latest transactions in your store.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="font-bold text-slate-500">View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Order ID</TableHead>
                  <TableHead className="px-6">Customer</TableHead>
                  <TableHead className="px-6">Amount</TableHead>
                  <TableHead className="px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.slice(0, 4).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="px-6 font-bold text-slate-900">{order.id}</TableCell>
                    <TableCell className="px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{order.customer}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-sm font-black text-slate-900">{order.total}</TableCell>
                    <TableCell className="px-6">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        order.status === "Delivered" && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                        order.status === "Processing" && "bg-blue-50 text-blue-600 border border-blue-100",
                        order.status === "Shipped" && "bg-violet-50 text-violet-600 border border-violet-100",
                        order.status === "Cancelled" && "bg-red-50 text-red-600 border border-red-100"
                      )}>
                        {order.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Activity/Quick Stats */}
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none shadow-2xl shadow-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Store Performance</CardTitle>
              <CardDescription className="text-slate-400">Monthly sales target progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">Progress</span>
                  <span className="font-black">68%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-white rounded-full h-2 w-[68%] transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target</p>
                  <p className="font-bold">$100k</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current</p>
                  <p className="font-bold">$68.4k</p>
                </div>
              </div>
              <Button variant="premium" className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold border-none shadow-none py-6">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent Customers</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <MoreVertical size={16} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {data.customers.map((user) => (
                <div key={user.name} className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs",
                    user.status === "Active" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                  )}>
                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{user.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.status}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 rounded-lg text-slate-300 hover:text-slate-900">
                    <ArrowUpRight size={14} />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
