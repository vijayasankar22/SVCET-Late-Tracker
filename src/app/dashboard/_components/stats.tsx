"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building, CalendarIcon } from "lucide-react";
import type { LateRecord } from "@/lib/types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type StatsProps = {
  records: LateRecord[];
};

export function Stats({ records }: StatsProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dailyStats = useMemo(() => {
    const targetDate = selectedDate.toLocaleDateString();
    
    const todaysRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate.toLocaleDateString() === targetDate;
    });

    const uniqueStudents = new Set(todaysRecords.map(r => r.studentName));

    const departmentCounts = todaysRecords.reduce((acc, record) => {
        acc[record.departmentName] = (acc[record.departmentName] || 0) + 1;
        return acc;
    }, {} as {[key: string]: number});


    return {
      lateCount: uniqueStudents.size,
      totalRecords: todaysRecords.length,
      departmentCounts: Object.entries(departmentCounts).sort((a,b) => b[1] - a[1]),
    };
  }, [records, selectedDate]);
  
  const dateDisplay = format(selectedDate, "PPP");

  return (
    <div className="space-y-4">
        <div className="flex justify-start">
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Students Late on {dateDisplay}</CardTitle>
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
                        <p className="text-sm text-muted-foreground text-center py-8">No late entries recorded on this day.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
