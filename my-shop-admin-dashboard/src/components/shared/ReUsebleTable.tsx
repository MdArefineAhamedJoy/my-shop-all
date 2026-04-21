"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, ArrowUpDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface ReUsebleTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  description?: string;
  onSearch?: (term: string) => void;
  searchPlaceholder?: string;
  actions?: (item: T) => React.ReactNode;
}

export default function ReUsebleTable<T extends { id: string | number }>({
  data,
  columns,
  onSearch,
  searchPlaceholder = "Search...",
  actions,
}: ReUsebleTableProps<T>) {
  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white">
      <div className="p-6 border-b border-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm group">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" 
              size={18} 
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 font-bold text-slate-600">
              <Filter size={16} className="mr-2" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 font-bold text-slate-600">
              Export
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={cn(column.className)}
                >
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors group">
                    {column.header}
                    <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </TableHead>
              ))}
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id} className="group">
                  {columns.map((column, index) => (
                    <TableCell key={index} className={cn(column.className)}>
                      {column.cell ? column.cell(item) : (item[column.accessorKey as keyof T] as React.ReactNode)}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-right">
                      {actions(item)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  className="h-32 text-center text-slate-400 font-medium"
                >
                  No data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
