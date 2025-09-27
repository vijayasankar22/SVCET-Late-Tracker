
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building, CalendarIcon as CalendarIconStat, User, UserCheck, RotateCcw } from "lucide-react";
import type { LateRecord } from "@/lib/types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";

type StatsProps = {
  records: LateRecord[];
};

export function Stats({ records }: StatsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });

  const [flippedDepartments, setFlippedDepartments] = useState<Record<string, boolean>>({});

  const handleFlip = (deptName: string) => {
    setFlippedDepartments(prev => ({ ...prev, [deptName]: !prev[deptName] }));
  };
  
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
        const deptName = record.departmentName;
        if (!acc[deptName]) {
            acc[deptName] = { total: 0, boys: 0, girls: 0 };
        }
        acc[deptName].total += 1;
        if (record.gender === 'MALE') {
            acc[deptName].boys += 1;
        } else if (record.gender === 'FEMALE') {
            acc[deptName].girls += 1;
        }
        return acc;
    }, {} as {[key: string]: { total: number, boys: number, girls: number }});


    return {
      lateCount: uniqueStudentRecords.length,
      boysCount,
      girlsCount,
      totalRecords: filtered.length,
      departmentCounts: Object.entries(departmentCounts).sort((a,b) => b[1].total - a[1].total),
    };
  }, [records, dateRange]);


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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <Card className="col-span-1 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students Late</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">{dailyStats.lateCount}</div>
                    <p className="text-xs text-muted-foreground pb-2">
                        Across all departments for the selected date(s)
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                        <div className="flex flex-col items-center justify-center">
                           <User className="h-5 w-5 text-muted-foreground" />
                           <p className="text-xs text-muted-foreground mt-1">Boys</p>
                           <div className="text-2xl font-bold">{dailyStats.boysCount}</div>
                        </div>
                         <div className="flex flex-col items-center justify-center">
                           <UserCheck className="h-5 w-5 text-muted-foreground" />
                           <p className="text-xs text-muted-foreground mt-1">Girls</p>
                           <div className="text-2xl font-bold">{dailyStats.girlsCount}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="col-span-1 lg:col-span-2">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Entries & Department Breakdown
                    </CardTitle>
                     <CardDescription className="flex items-center text-xs">
                        <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                        Repeated entries are included
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="text-4xl font-bold">{dailyStats.totalRecords}</div>
                   <p className="text-xs text-muted-foreground">
                        Total number of times students have been marked late.
                    </p>
                    {dailyStats.departmentCounts.length > 0 ? (
                        <div className="mt-4 border-t pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dailyStats.departmentCounts.map(([dept, counts]) => (
                            <div key={dept} className="flip-card cursor-pointer" onClick={() => handleFlip(dept)}>
                                <motion.div 
                                    className="flip-card-inner relative w-full h-full"
                                    initial={false}
                                    animate={{ rotateY: flippedDepartments[dept] ? 180 : 0 }}
                                    transition={{ duration: 0.6, animationDirection: "normal" }}
                                >
                                    {/* Front of the card */}
                                    <div className="flip-card-front absolute w-full h-full">
                                        <Card className="w-full h-full flex flex-col justify-center items-center border-none shadow-lg">
                                            <CardHeader className="p-2">
                                                <CardTitle className="text-sm font-semibold text-primary truncate">{dept}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-2 flex-grow flex flex-col justify-center items-center">
                                                <p className="text-4xl font-bold text-primary">{counts.total}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Total Entries</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Back of the card */}
                                    <div className="flip-card-back absolute w-full h-full">
                                        <Card className="w-full h-full flex flex-col justify-center items-center bg-primary text-primary-foreground border-none shadow-lg">
                                             <CardHeader className="p-2 flex-row items-center justify-between w-full">
                                                <CardTitle className="text-sm font-semibold truncate">{dept}</CardTitle>
                                                <RotateCcw className="h-4 w-4"/>
                                            </CardHeader>
                                            <CardContent className="p-2 flex-grow grid grid-cols-2 gap-2 w-full">
                                                <div className="text-center bg-primary-foreground/10 p-2 rounded-lg flex flex-col justify-center">
                                                    <p className="font-bold text-2xl">{counts.boys}</p>
                                                    <p className="text-xs">Boys</p>
                                                </div>
                                                <div className="text-center bg-primary-foreground/10 p-2 rounded-lg flex flex-col justify-center">
                                                    <p className="font-bold text-2xl">{counts.girls}</p>
                                                    <p className="text-xs">Girls</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </motion.div>
                            </div>
                          ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">No entries for selected date.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
