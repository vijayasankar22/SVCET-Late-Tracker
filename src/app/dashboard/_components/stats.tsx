"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building, CalendarIcon as CalendarIconStat } from "lucide-react";
import type { LateRecord } from "@/lib/types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type StatsProps = {
  records: LateRecord[];
};

export function Stats({ records }: StatsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  
  const dailyStats = useMemo(() => {
    
    const filtered = records.filter(record => {
      if (!dateRange?.from) {
        return true;
      }
      try {
        const recordDate = new Date(record.timestamp);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        if (recordDate < fromDate) {
            return false;
        }

        if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            if (recordDate > toDate) {
                return false;
            }
        } else {
            // If only 'from' is selected, filter for that single day
            const fromDateEnd = new Date(dateRange.from);
            fromDateEnd.setHours(23, 59, 59, 999);
            if (recordDate > fromDateEnd) {
              return false;
            }
        }
        return true;
      } catch (e) {
          return true;
      }
    });

    const uniqueStudents = new Set(filtered.map(r => r.studentName));

    const departmentCounts = filtered.reduce((acc, record) => {
        acc[record.departmentName] = (acc[record.departmentName] || 0) + 1;
        return acc;
    }, {} as {[key: string]: number});


    return {
      lateCount: uniqueStudents.size,
      totalRecords: filtered.length,
      departmentCounts: Object.entries(departmentCounts).sort((a,b) => b[1] - a[1]),
    };
  }, [records, dateRange]);
  
  const dateDisplay = useMemo(() => {
    if (dateRange?.from) {
      if (dateRange.to) {
        if (format(dateRange.from, "PPP") === format(dateRange.to, "PPP")) {
          return format(dateRange.from, "PPP");
        }
        return `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`;
      }
      return format(dateRange.from, "PPP");
    }
    return 'All Time';
  }, [dateRange]);


  return (
    <div className="space-y-4">
        <div className="flex items-center justify-end">
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIconStat className="mr-2 h-4 w-4" />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Students Late ({dateDisplay})</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dailyStats.lateCount}</div>
                    <p className="text-xs text-muted-foreground">
                        {dailyStats.totalRecords} total entries recorded.
                    </p>
                </CardContent>
            </Card>
            <Card className="lg:col-span-3">
                 <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        Department Breakdown ({dateDisplay})
                    </CardTitle>
                    <CardDescription>
                        Total late entries recorded for each department.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {dailyStats.departmentCounts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {dailyStats.departmentCounts.map(([dept, count]) => (
                                <div key={dept} className="bg-primary/5 p-4 rounded-lg text-center">
                                    <p className="text-sm font-medium text-primary/80">{dept}</p>
                                    <p className="text-2xl font-bold text-primary">{count}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No late entries recorded for this date range.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
