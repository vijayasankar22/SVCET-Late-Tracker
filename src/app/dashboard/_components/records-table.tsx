"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, FileDown } from "lucide-react";
import type { LateRecord, Department, Class } from "@/lib/types";
import { exportToCsv } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type RecordsTableProps = {
  records: LateRecord[];
  loading: boolean;
  departments: Department[];
  classes: Class[];
};

export function RecordsTable({ records, loading, departments, classes }: RecordsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const availableClasses = useMemo(() => {
    if (departmentFilter === 'all') {
      return classes;
    }
    const dept = departments.find(d => d.id === departmentFilter);
    if (!dept) return [];
    return classes.filter(c => c.departmentId === dept.id);
  }, [departmentFilter, departments, classes]);

  const filteredRecords = useMemo(() => {
    let dateFilteredRecords = records.filter((record) => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) return true;
        const recordDate = new Date(record.timestamp);
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (recordDate < fromDate) return false;
        }
        if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            if (recordDate > toDate) return false;
        }
        return true;
      });

    const studentLateCounts = dateFilteredRecords.reduce((acc, record) => {
      acc[record.studentName] = (acc[record.studentName] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return records
      .filter((record) =>
        record.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((record) =>
        departmentFilter === "all" || record.departmentName === departments.find(d => d.id === departmentFilter)?.name
      )
      .filter((record) =>
        classFilter === "all" || record.className === classes.find(c => c.id === classFilter)?.name
      )
      .filter((record) => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) return true;
        try {
            const recordDate = new Date(record.timestamp);
            if (dateRange.from) {
                const fromDate = new Date(dateRange.from);
                fromDate.setHours(0, 0, 0, 0);
                if (recordDate < fromDate) return false;
            }
            if (dateRange.to) {
                const toDate = new Date(dateRange.to);
                toDate.setHours(23, 59, 59, 999);
                if (recordDate > toDate) return false;
            }
            return true;
        } catch (e) {
            return true;
        }
      })
      .map(record => ({
          ...record,
          timesLate: studentLateCounts[record.studentName] || 0
      }))
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
  }, [records, searchTerm, departmentFilter, classFilter, dateRange, departments, classes]);

  const handleExportCsv = () => {
    const recordsToExport = filteredRecords.map((record, index) => ({
      "S.No.": index + 1,
      studentName: record.studentName,
      departmentName: record.departmentName,
      className: record.className,
      date: record.date,
      time: record.time,
      status: record.status,
      markedBy: record.markedBy,
      timesLate: record.timesLate,
    }));
    exportToCsv("late-records.csv", recordsToExport);
  };

  const handleExportPdf = async () => {
    const doc = new jsPDF();
    
    // This is your image embedded as a base64 string
    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAZlBMVEX////9+Pj6+/v5+fn9+vrz9PT/+vrt8vL4+Pj19fX8/Pz09PT6+vr7+/v39/f5+vv9/v7y8vLg4ODS0tLi4uLu7u7p6enW1tbNzc3Dw8O9vb3v8/P3+PjP0dPV2tve4eHT1tjBw8WnqK64uroAAAD3WqyBAAAEDklEQVR4nO2dW3eiQAyGoYIIKioo4s7u+/7vOW5qG3GzVzHJJt/3zgwzD/m5hJAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADcM0rTNE3z8CzjNMXTNO8+HxZcs55A4+k8xR8f9/Yed5/f29t73H1+bm9vYhD38L6/x52n5629/Q12n19bA4N4kLfrvP/8+br9/R32fN5v7+9nEOPwvr/HnafX1t5ehx2nt9behx3wP/g/mWCe5h/c5/d2x92n59benjYPMQy7j+/tfee/39vbG/0+b/9+f497n59bA4P4/h73Pg8P4fP+HvdeD8N83v7+Hm+fX1t7+xvMvL9+f38P8/v8+b/9/T3efn5ub+/z+zvs+bz9/f38/f29vc+D/1kH3E+n+e1t7G3s5/c2dr/fW3v7/e8/3x9M3G+vH9/b+3vY918e97f397f394P5P28/f4+9n7/f29t7+3u8/f39+f1m4H3er+3t7f1+3n5/j73f38+Pj/f29jb2cfb7e3t7e/s77P28/f4eax/c29vb25s7+HwO8/v8eZ4m/hjj+X6ePzzPMs5/Z4nj+ft5/uQ8z/9nh/H8/v4e9z4/t7f3ef39/f39/f093n1+b2/v8/s7+Hw+n+f5k/M8z/M8z3N+3+c5z/M8zz/39vb29k/O/6yL/21vb28v4/6+f3+/P5if39vb25s72f/z+f29vb29vX+Y+v39/f38f/w//p/M//v9+f39/X7+z9/P/+f29vb+/v7+Hu8+P7e393n9/f38/f29vc+D/2mB+G45T/MP7n1/jzufX1v7e3s72XWc/X5vb29v729n+3x8+Hze/n5v7e1v7G8yv9/f38/f39/b2/v7+3vY+zxv7+9j7fPz8/Pze/s77Pm8/f093n1+b29vb29v72/v7+8/Pz/P8/zJcZ7n+ZMz7z+/t7f39/e/P5j6/f39/P38/f29vb29vX+Y+v39/X7efn+PvZ+v29vb29vbmzv4fA7z+/x5niZ+GOP5fp4/PM8yzv9niYf5+//5n+f/fM7zPM9/fn9vbx/+/h5v/35/j3ufX1sDw/j+Hnfe3tvb2xv0Pl9bA4P4/h53nl9b+/sa7T6/tQeG8f097nx+b+/z+/t7e3t7e/9ZJ6/r8/s7zP28/f4e69/f29vb29vbmzv4fA7z+/x5niZ+GOP5fp4/PM8yzv9niYf5+//5n+f/fM7zPM9/fn9vbx/+/h5v/35/j3ufX1sDw/j+Hnfe3tvb2xv0Pl9bA4P4/h53nl9b+/sa7T6/tQeG8f097nx+b+/z+/t7e3t7e/9ZpyzN0zR/cD+/txv2Pl9b+/sa7T6/tQeG8f097nx+b2/v8/s77Pm8/f093n1+bm/v8/s77P28/f091j64t7e3t7c3d/D5HOb3+fM8TfwxxvL9PH94nmWc/84SD/N3/+d/nv/zOc/zPP/5/b29ffj7e7z9+/097n1+bQ0M4vt73Hl/b29vb9D7fG0NDOL7e9x5fW3t72u0+/zaHhjG9/e48/nZ3uf39/b29vb2/rNOeZqmaT6+t/b3Nd59fm0PDOOOOOOOOOOOOOOOOOOOAPjW6O1BvKzVf7rR//+Xh3s60X7/6P7e8u/42p1u0K5/92//+t8H//Pjw74f18+f3//h7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u-/w0AZqR1gAAAABJRU5ErkJggg==";
    
    // Add the image to the document. Parameters are: image data, format, x, y, width, height
    doc.addImage(base64Image, 'PNG', 15, 10, 30, 10);

    doc.setFontSize(20);
    doc.text('SVCET Late Entry Records', 15, 25);
    doc.setFontSize(12);
    const dateRangeText = `From: ${dateRange?.from ? format(dateRange.from, 'PPP') : 'N/A'}  To: ${dateRange?.to ? format(dateRange.to, 'PPP') : 'N/A'}`;
    doc.text(dateRangeText, 15, 35);

    autoTable(doc, {
      startY: 45,
      head: [['S.No.', 'Student Name', 'Department', 'Class', 'Date', 'Time', 'Status', 'Marked By', 'Times Late']],
      body: filteredRecords.map((record, index) => [
        index + 1,
        record.studentName,
        record.departmentName,
        record.className,
        record.date,
        record.time,
        record.status,
        record.markedBy,
        record.timesLate.toString(),
      ]),
      headStyles: { fillColor: [30, 58, 138] },
      styles: { cellPadding: 2, fontSize: 8 },
    });

    doc.save("late-records.pdf");
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                 <CardTitle className="font-headline text-2xl">Late Entry Records</CardTitle>
                <CardDescription>View, filter, and export late student records.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleExportCsv} variant="outline" size="sm" className="gap-2">
                    <FileDown />
                    Export CSV
                </Button>
                 <Button onClick={handleExportPdf} variant="outline" size="sm" className="gap-2">
                    <Download />
                    Export PDF
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by student name..."
              className="pl-8 sm:w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
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
                <PopoverContent className="w-auto p-0" align="start">
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
           <div className="flex gap-4">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
                 <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {availableClasses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
           </div>
        </div>
        <div className="rounded-lg border">
          <Table className="table-alternating-rows">
            <TableHeader>
              <TableRow>
                <TableHead>S.No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Marked By</TableHead>
                <TableHead>Times Late</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={9}><Skeleton className="h-6" /></TableCell>
                        </TableRow>
                    ))
                ) : filteredRecords.length > 0 ? (
                    filteredRecords.map((record, index) => (
                        <TableRow key={record.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{record.studentName}</TableCell>
                            <TableCell>{record.departmentName}</TableCell>
                            <TableCell>{record.className}</TableCell>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.time}</TableCell>
                             <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'Informed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {record.status}
                                </span>
                            </TableCell>
                            <TableCell>{record.markedBy}</TableCell>
                            <TableCell>
                                <span className={`font-bold ${record.timesLate >= 3 ? 'text-destructive' : 'text-primary'}`}>{record.timesLate}</span>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                     <TableRow>
                        <TableCell colSpan={9} className="text-center">
                            No records found for the selected filters.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
