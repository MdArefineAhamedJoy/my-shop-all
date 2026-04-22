import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  accent: string;
  sub?: string;
}

interface StatsCardsProps {
  stats: StatItem[];
  gridCols?: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({ 
  stats, 
  gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" 
}) => {
  return (
    <div className={cn("grid gap-4", gridCols)}>
      {stats.map((stat) => (
        <Card key={stat.label} className="relative bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden rounded-md">
          {/* Left Accent Bar */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-[5px]", stat.accent)} />
          
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-1">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">{stat.label}</p>
              <div className={cn("p-2 rounded-md border", stat.bg)}>
                <stat.icon size={22} className={stat.color} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className={cn("text-xs font-bold uppercase", stat.color)}>
                    {stat.unit}
                  </span>
                )}
              </div>
              {stat.sub && (
                <p className="text-slate-400 text-xs font-medium mt-1">
                  {stat.sub}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
