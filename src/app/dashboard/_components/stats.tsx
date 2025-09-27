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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });
  
  const dailyStats = useMemo(() => {
    
    const filtered = records.filter(record => {
      if (!dateRange?.from) {
        return false; // Should not happen with default, but good practice
      }
      try {
        const recordDate = new Date(record.timestamp);
        
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        if (recordDate < fromDate) {
            return false;
        }

        const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        toDate.setHours(23, 59, 59, 999);

        if (recordDate > toDate) {
            return false;
        }

        return true;
      } catch (e) {
          console.error("Error filtering stats by date:", e);
          return true;
      }
    });

    const uniqueStudentRecords: LateRecord[] = [];
    const uniqueStudentIds = new Set<string>();

    for (const record of filtered) {
        const studentIdentifier = record.studentId || record.studentName;
        if (!uniqueStudentIds.has(studentIdentifier)) {
            uniqueStudentIds.add(studentIdentifier);
            uniqueStudentRecords.push(record);
        }
    }
    
    const boysCount = uniqueStudentRecords.filter(r => r.gender === 'MALE').length;
    const girlsCount = uniqueStudentRecords.filter(r => r.gender === 'FEMALE').length;

    const departmentCounts = filtered.reduce((acc, record) => {
        acc[record.departmentName] = (acc[record.departmentName] || 0) + 1;
        return acc;
    }, {} as {[key: string]: number});


    return {
      lateCount: uniqueStudentRecords.length,
      boysCount,
      girlsCount,
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
    return 'Select a date';
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students Late</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dailyStats.lateCount}</div>
                    <p className="text-xs text-muted-foreground">
                        {dailyStats.boysCount} boys and {dailyStats.girlsCount} girls. {dailyStats.totalRecords} total entries.
                    </p>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        Dept. Breakdown
                    </CardTitle>
                     <CardDescription>
                        Total entries by department for {dateDisplay}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {dailyStats.departmentCounts.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {dailyStats.departmentCounts.map(([dept, count]) => (
                                <div key={dept} className="bg-primary/5 p-2 rounded-lg text-center">
                                    <p className="text-xs font-medium text-primary/80 truncate">{dept}</p>
                                    <p className="text-lg font-bold text-primary">{count}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No entries found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
