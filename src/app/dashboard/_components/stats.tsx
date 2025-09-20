"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
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

    return {
      lateCount: uniqueStudents.size,
      totalRecords: todaysRecords.length,
    };
  }, [records, selectedDate]);

  return (
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
  );
}
