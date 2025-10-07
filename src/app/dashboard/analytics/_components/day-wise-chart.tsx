
'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { LateRecord } from '@/lib/types';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, eachDayOfInterval, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type ChartProps = {
  records: LateRecord[];
};

export function DayWiseChart({ records }: ChartProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const from = subDays(today, 29); // Last 30 days
    return { from, to: today };
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

    const dayCounts: { [key: string]: number } = {};

    const daysInInterval = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to
    });

    for (const day of daysInInterval) {
        const dayKey = format(day, 'MMM dd');
        dayCounts[dayKey] = 0;
    }

    for (const record of filteredRecords) {
      const dayKey = format(new Date(record.timestamp), 'MMM dd');
      if (dayKey in dayCounts) {
        dayCounts[dayKey]++;
      }
    }
    
    return Object.entries(dayCounts).map(([name, count]) => ({
      name,
      'Late Entries': count,
    }));

  }, [records, dateRange]);

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h3 className="text-lg font-medium">Day-wise Late Entries</h3>
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
                   <div className="flex flex-col space-y-2 p-2">
                        <Select
                          onValueChange={(value) => {
                            const now = new Date();
                            if (value === "today") {
                              setDateRange({ from: now, to: now });
                            } else if (value === "this-week") {
                              setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
                            } else if (value === "this-month") {
                              setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a preset" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="this-week">This Week</SelectItem>
                            <SelectItem value="this-month">This Month</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="rounded-md border">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                          />
                        </div>
                      </div>
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

    