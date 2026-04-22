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
import { ArrowUpDown } from "lucide-react";
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
  actions?: (item: T) => React.ReactNode;
}

export default function ReUsebleTable<T extends { id: string | number }>({
  data,
  columns,
  actions,
}: ReUsebleTableProps<T>) {
  return (
    <Card className="border shadow-none rounded-none overflow-hidden bg-white">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={cn("h-14 py-4 px-6", column.className)}
                >
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors group text-sm font-bold text-slate-600 uppercase tracking-tight">
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
