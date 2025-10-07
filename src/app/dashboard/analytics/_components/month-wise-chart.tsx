
'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { LateRecord } from '@/lib/types';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

type ChartProps = {
  records: LateRecord[];
};

export function MonthWiseChart({ records }: ChartProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const from = subMonths(startOfMonth(today), 11); // Last 12 months
    const to = endOfMonth(today);
    return { from, to };
  });

  const chartData = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
        return [];
    }

    const filteredRecords = records.filter(record => {
      try {
        const recordDate = new Date(record.timestamp);
        return recordDate >= dateRange.from! && recordDate <= dateRange.to!;
      } catch (e) {
        return false;
      }
    });

    const monthCounts: { [key: string]: number } = {};

    const monthsInInterval = eachMonthOfInterval({
        start: dateRange.from,
        end: dateRange.to
    });

    for (const monthStart of monthsInInterval) {
        const monthKey = format(monthStart, 'MMM yyyy');
        monthCounts[monthKey] = 0;
    }

    for (const record of filteredRecords) {
      const monthKey = format(new Date(record.timestamp), 'MMM yyyy');
      if (monthKey in monthCounts) {
        monthCounts[monthKey]++;
      }
    }
    
    return Object.entries(monthCounts).map(([name, count]) => ({
      name,
      'Late Entries': count,
    }));

  }, [records, dateRange]);

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h3 className="text-lg font-medium">Month-wise Late Entries</h3>
            <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[300px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
        </div>
         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                        }}
                    />
                    <Legend />
                    <Bar dataKey="Late Entries" fill="hsl(var(--primary))" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}
