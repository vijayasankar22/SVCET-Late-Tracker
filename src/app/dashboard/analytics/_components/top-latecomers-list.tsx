
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LateRecord, Student, Department, Class } from '@/lib/types';
import { Download, User, Calendar as CalendarIcon, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DateRange } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

type TopLatecomersListProps = {
  records: LateRecord[];
  students: Student[];
  departments: Department[];
  classes: Class[];
  logoBase64: string | null;
};

export function TopLatecomersList({ records, students, departments, classes, logoBase64 }: TopLatecomersListProps) {
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const topLatecomers = useMemo(() => {
    let filteredRecords = records;

    if (departmentFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => {
            const student = students.find(s => s.id === record.studentId);
            if (student) {
                const department = departments.find(d => d.id === student.departmentId);
                return department?.name === departmentFilter;
            }
            return record.departmentName === departmentFilter;
        });
    }

    if (dateRange?.from) {
        filteredRecords = filteredRecords.filter(record => {
            try {
                const recordDate = new Date(record.timestamp);
                const fromDate = new Date(dateRange.from!);
                fromDate.setHours(0, 0, 0, 0);

                if (recordDate < fromDate) return false;

                const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from!);
                toDate.setHours(23, 59, 59, 999);
                if (recordDate > toDate) return false;

                return true;
            } catch (e) {
                return true;
            }
        });
    }


    const studentLateCounts: { [key: string]: { count: number, record: LateRecord } } = {};
    const studentMapByName = new Map(students.map(s => [s.name.toLowerCase(), s]));

    for (const record of filteredRecords) {
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
  }, [records, students, departments, classes, departmentFilter, dateRange]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let contentY = 10;

    const drawContent = () => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Top 10 Latecomers", pageWidth / 2, contentY, { align: "center" });
      contentY += 8;

      doc.setFontSize(10);
      const deptSubTitle = departmentFilter === 'all' ? 'All Departments' : departmentFilter;
      const dateSubTitle = dateRange?.from 
        ? `From: ${format(dateRange.from, 'dd/MM/yyyy')} To: ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : format(dateRange.from, 'dd/MM/yyyy')}`
        : 'All Time';

      doc.text(`${deptSubTitle} | ${dateSubTitle}`, pageWidth / 2, contentY, { align: 'center' });
      contentY += 10;
  
      autoTable(doc, {
        startY: contentY,
        head: [['Rank', 'Student Name', 'Register No.', 'Department', 'Class', 'Total Late Entries']],
        body: topLatecomers.map((student, index) => [
          index + 1,
          student.name,
          student.registerNo,
          student.departmentName,
          student.className,
          student.count,
        ]),
        headStyles: { fillColor: [30, 58, 138], lineColor: [44, 62, 80], lineWidth: 0.1 },
        styles: { cellPadding: 2, fontSize: 8, lineColor: [44, 62, 80], lineWidth: 0.1 },
      });
  
      doc.save(`top-10-latecomers_${departmentFilter}.pdf`);
    };

    if (logoBase64) {
      try {
        const img = new window.Image();
        img.src = logoBase64;
        img.onload = () => {
            const originalWidth = 190;
            const scalingFactor = 0.7;
            const imgWidth = originalWidth * scalingFactor;
            const ratio = img.width / img.height;
            const imgHeight = imgWidth / ratio;
            const x = (pageWidth - imgWidth) / 2;
            doc.addImage(logoBase64, 'PNG', x, contentY, imgWidth, imgHeight);
            contentY += imgHeight + 5;
            drawContent();
        };
        img.onerror = () => {
            console.error("Error loading image for PDF.");
            drawContent();
        };
      } catch (e) {
        console.error("Error adding image to PDF:", e);
        drawContent();
      }
    } else {
        drawContent();
    }
  };


  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h3 className="text-lg font-medium">Top 10 Latecomers {dateRange ? `(Filtered)`: `(All Time)`}</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full sm:w-[260px] justify-start text-left font-normal relative",
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
                         {dateRange && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 absolute right-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDateRange(undefined);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
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
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button onClick={handleExportPdf} size="sm" variant="outline" disabled={topLatecomers.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>
        </div>
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
                                No late entry data available for the selected filter.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
