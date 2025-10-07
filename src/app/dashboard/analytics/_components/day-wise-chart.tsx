
'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { LateRecord, Department } from '@/lib/types';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

type ChartProps = {
  records: LateRecord[];
  departments: Department[];
};

export function DayWiseChart({ records, departments }: ChartProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: startOfWeek(today), to: endOfWeek(today) };
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const departmentColors = useMemo(() => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];
    const colorMap: { [key: string]: string } = {};
    departments.forEach((dept, index) => {
      colorMap[dept.name] = colors[index % colors.length];
    });
    return colorMap;
  }, [departments]);

  const chartData = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
        return [];
    }

    const filteredRecords = records.filter(record => {
      try {
        const recordDate = new Date(record.timestamp);
        const from = dateRange.from!;
        from.setHours(0, 0, 0, 0);
        const to = dateRange.to!;
        to.setHours(23, 59, 59, 999);
        return recordDate >= from && recordDate <= to;
      } catch (e) {
        return false;
      }
    });

    const dayCounts: { [key: string]: { [dept: string]: number } } = {};

    const daysInInterval = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to
    });

    // Initialize all days and departments to 0
    for (const day of daysInInterval) {
        const dayKey = format(day, 'MMM dd');
        dayCounts[dayKey] = {};
        for (const dept of departments) {
            dayCounts[dayKey][dept.name] = 0;
        }
    }

    // Populate counts from records
    for (const record of filteredRecords) {
      const dayKey = format(new Date(record.timestamp), 'MMM dd');
      if (dayKey in dayCounts && record.departmentName in dayCounts[dayKey]) {
        dayCounts[dayKey][record.departmentName]++;
      }
    }
    
    return Object.entries(dayCounts).map(([name, depts]) => ({
      name,
      ...depts
    }));

  }, [records, dateRange, departments]);

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h3 className="text-lg font-medium">Day-wise Late Entries</h3>
             <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
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
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    const now = new Date();
                                    setDateRange({ from: now, to: now });
                                    setIsDatePickerOpen(false);
                                }}>Today</Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    const now = new Date();
                                    setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
                                    setIsDatePickerOpen(false);
                                }}>This Week</Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    const now = new Date();
                                    setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
                                    setIsDatePickerOpen(false);
                                }}>This Month</Button>
                            </div>
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
        </div>
         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={chartData.length > 31 ? Math.floor(chartData.length / 31) : 0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                        }}
                    />
                    <Legend />
                    {departments.map(dept => (
                      <Bar 
                        key={dept.id} 
                        dataKey={dept.name} 
                        stackId="a" 
                        fill={departmentColors[dept.name]} 
                      />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}
