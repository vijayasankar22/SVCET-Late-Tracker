
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

export function TopLatecomersList({ records, students, departments, classes }: TopLatecomersListProps) {
  const topLatecomers = useMemo(() => {
    const studentLateCounts: { [key: string]: { count: number, record: LateRecord } } = {};
    const studentMapByName = new Map(students.map(s => [s.name.toLowerCase(), s]));

    for (const record of records) {
      let student: Student | undefined;
      if (record.studentId) {
        student = students.find(s => s.id === record.studentId);
      }
      if (!student) {
        student = studentMapByName.get(record.studentName.toLowerCase());
      }
      
      const studentKey = student?.id || `${record.studentName.toLowerCase()}-${record.registerNo}`;

      if (!studentKey) continue;

      if (!studentLateCounts[studentKey]) {
        studentLateCounts[studentKey] = { count: 0, record };
      }
      studentLateCounts[studentKey].count++;
    }

    const studentsWithDetails = Object.values(studentLateCounts)
      .map(({ count, record }) => {
        let studentDetails = students.find(s => s.id === record.studentId);
        if(!studentDetails) {
            studentDetails = studentMapByName.get(record.studentName.toLowerCase());
        }

        if (!studentDetails) {
            // Fallback to record data if student not found in master list
            const department = departments.find(d => d.name === record.departmentName);
            const studentClass = classes.find(c => c.name === record.className && c.departmentId === department?.id);
            return {
              id: record.id,
              name: record.studentName,
              registerNo: record.registerNo,
              count,
              departmentName: record.departmentName,
              className: record.className,
            };
        }

        const department = departments.find(d => d.id === studentDetails!.departmentId);
        const studentClass = classes.find(c => c.id === studentDetails!.classId);

        return {
          ...studentDetails,
          count,
          departmentName: department?.name || 'N/A',
          className: studentClass?.name || 'N/A',
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return studentsWithDetails;
  }, [records, students, departments, classes]);

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
                                <TableCell>{student.className}</TableCell>
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
