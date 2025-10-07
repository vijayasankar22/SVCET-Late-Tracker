
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LateRecord, Student, Department, Class } from '@/lib/types';
import { User } from 'lucide-react';

type TopLatecomersListProps = {
  records: LateRecord[];
  students: Student[];
  departments: Department[];
  classes: Class[];
};

export function TopLatecomersList({ records, students, departments }: TopLatecomersListProps) {
  const topLatecomers = useMemo(() => {
    const studentLateCounts: { [key: string]: number } = {};
    for (const record of records) {
      if (record.studentId) {
        studentLateCounts[record.studentId] = (studentLateCounts[record.studentId] || 0) + 1;
      }
    }

    const studentsWithDetails = Object.entries(studentLateCounts)
      .map(([studentId, count]) => {
        const studentDetails = students.find(s => s.id === studentId);
        if (!studentDetails) return null;

        const department = departments.find(d => d.id === studentDetails.departmentId);

        return {
          ...studentDetails,
          count,
          departmentName: department?.name || 'N/A',
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return studentsWithDetails;
  }, [records, students, departments]);

  return (
    <div className="space-y-4">
        <h3 className="text-lg font-medium">Top 10 Latecomers (All Time)</h3>
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Register No.</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Total Late Entries</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {topLatecomers.length > 0 ? (
                        topLatecomers.map((student, index) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.registerNo}</TableCell>
                                <TableCell>{student.departmentName}</TableCell>
                                <TableCell>{student.classId.split('-').slice(1).join('-').toUpperCase()}</TableCell>
                                <TableCell className="text-right font-bold">{student.count}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">
                                No late entry data available.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
