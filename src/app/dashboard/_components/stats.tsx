"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building } from "lucide-react";
import type { LateRecord } from "@/lib/types";

type StatsProps = {
  records: LateRecord[];
};

export function Stats({ records }: StatsProps) {
  const [selectedDate] = useState(new Date());

  const dailyStats = useMemo(() => {
    const targetDate = selectedDate.toLocaleDateString();
    
    const todaysRecords = records.filter(record => {
      return record.date === targetDate;
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students Late Today ({selectedDate.toLocaleDateString()})</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{dailyStats.lateCount}</div>
                <p className="text-xs text-muted-foreground">
                    {dailyStats.totalRecords} total entries recorded today.
                </p>
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    Department Breakdown (Today)
                </CardTitle>
                <CardDescription>
                    Total late entries recorded today for each department.
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
                    <p className="text-sm text-muted-foreground text-center py-8">No late entries recorded yet today.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
