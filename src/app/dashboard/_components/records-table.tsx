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
    const recordsToExport = filteredRecords.map(record => ({
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

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const collegeLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAMAAACMs6KhAAAA/FBMVEX//////wAAmP8Am/8Akv8An/8Al/8AlP8Alv8AmP8Alv8Amv8AmP8Alv8Amf8An/8AnP8Al/8Al/8Alv8Alv8Al/8Am/8Amf8Akv8Alv8Amf8Aov8Aov8An/8Akv8Alv8AnP8Amf8Akv8Alv8Alv8Akv8Akv8Akv8Akv8Akv8Akv8Al/8Al/8Alv8Akv8Al/8Al/8Al/8Akv8Al/8Akv8Akv8Akv8Akv8Alv8Alv8Alv8Alv8Akv8Akv8Alv8Alv8Akv8Akv8Akv8Akv8Akv8Akv8Akv8Akv8Al/8Al/8Akv8Alv8Al/8Akv8Akv8Al/8Al/8Akv8Akv8Akv8Al/8Akv8Akv8Al/8Akv8Akv8Akv+LCg42AAAAVHRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcZGhscHR4fICEiIyUnKCkqKywtLi8wMTIzNDU3ODk6Ozw9PkBBQkNERUZISUpMTk9QU1RUVllbXF5fYGFiY2VmZ2hpamtsbmMAAAQYSURBVHja7d3XctNAEAbgD5pM2iYt2naBtknbpG2bbpNu2nb/B0ISe5qPZLrJzPl7icnMl8kXyY/NByIgIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIlJDeYhMJSJL05R7fS+5TiL3zZk/c+bPfNkWJ07yv0X//HRd1Z8L61Kk6lY+l+I1eK6tEw/n+m5/9q0DfxBv3cK/Qv377o5w4wTCTYwXp/wM/gH/D+D5bAb2fS5iGz2N3x/Btx/h5w/49S72eBf7+QP8+Q7+fAf/foj/fsO/f8T/PsM/H+HrXez3H/BzCP88gX8e4dcX8Os7+PUd/Pke/nwH/36E/36D/37E/z7D/x/h6w/4fYTv3+Lb3fC79fh39Pj2dnh3Njy7Fp4tC89u/qezx8+b4L7u+P3z/77983637Wc3+s32m5v99v25/X3n+t2u/36/+/0e//+d/s//CfF9lHwQk//sJ/n/b/n/A/k/A/k/k/L/a8j/HyP//478//vk/4+T//eX/I+Q//dX/L+R//f98n9L//uQ//8P+X9r+f+95P995f/d5X9X+f/l/B/G/T9H3k3j/77h3xfx7/3493b8exv+PYNvN8NvP8HvV+PXb/Hrvfh1Ljy7Fn43D1+bj6/th5f2g4v7g4X9cMG+OGf/L9n/S/b/8vy/tPwv7f9L+3/b/j/I/x8n//+c/D8u/o+S/scl/2cl/5eL/7eL/8OV//FK/L5c8n3R7f6c+33FfN/jP19wn/P48xx+PAcfzYMT+cBE/L8u35cJX5eGr43DV/vBxX1wYT+Y0g8m9EOD/J+h//2h/72B/uYE+psF6mcVqF/1b35z9+t+t/8u9HuD/f5g//vD//eR/1/B/leS/59f8v+q5P+15H9d8v9Gef/Xl/f/kP3/R/j/H+L/Hwjf/xfc9wX3cY98nCPf5wkPcIM7fIAH+IAv+IB/gXf/gff/gQ3/Bo/7g/38YL+eWH8nrJ+T28+F9XPhfF447xaeC8PzwnhemP8X5g/F+YNw/lCcPxDnD/z5g3n+wJx/sOYfLPiHc/zDOf5gTn6wIR9Yjw/W44P1/GC9PVhvT6y3J9bbw+vt4fV2cfW6uLpcXF0urm4XV3eLq7vF1d2C6u5wdffguvvQuevgdOfgcnn/vHR/Lp2fC+fnwnl9vL4+vL6tPb/v1p6fn6vP7f/L1d2i6u5wdffguntw3T04rp4cV6eKq8vF1eXi6m5x9a5w9bpcXh+vb+/fP4C7z5G9L7n3H/P//wC/f/87IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIlLt/AFiGBCK/0/cNAAAAABJRU5ErkJggg==';
    doc.addImage(collegeLogo, 'PNG', 15, 10, 30, 30);
    doc.setFontSize(20);
    doc.text('SVCET Late Entry Records', 55, 25);
    
    const tableHead = [['Student Name', 'Department', 'Class', 'Date', 'Time', 'Status', 'Marked By', 'Times Late']];
    const tableBody = filteredRecords.map(record => [
      record.studentName,
      record.departmentName,
      record.className,
      record.date,
      record.time,
      record.status,
      record.markedBy,
      record.timesLate,
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 50,
    });

    doc.save("late-records.pdf");
  };
  
  const handleDepartmentChange = (value: string) => {
    setDepartmentFilter(value);
    setClassFilter("all");
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle className="font-headline text-2xl">Late Records</CardTitle>
                <CardDescription>View, filter, and export all recorded late entries.</CardDescription>
            </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPdf} disabled={filteredRecords.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Export to PDF
            </Button>
            <Button onClick={handleExportCsv} disabled={filteredRecords.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={handleDepartmentChange} disabled={departments.length === 0}>
            <SelectTrigger><SelectValue placeholder="Filter by Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter} disabled={availableClasses.length === 0}>
            <SelectTrigger><SelectValue placeholder="Filter by Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {availableClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal",
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

        <div className="rounded-lg border">
          <Table className="table-alternating-rows">
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead className="font-bold text-primary">Student Name</TableHead>
                <TableHead className="font-bold text-primary">Department</TableHead>
                <TableHead className="font-bold text-primary">Class</TableHead>
                <TableHead className="font-bold text-primary">Date</TableHead>
                <TableHead className="font-bold text-primary">Time</TableHead>
                <TableHead className="font-bold text-primary">Status</TableHead>
                <TableHead className="font-bold text-primary">Marked By</TableHead>
                <TableHead className="font-bold text-primary text-center">Times Late</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-8 w-full my-2" />
                    <Skeleton className="h-8 w-full my-2" />
                    <Skeleton className="h-8 w-full my-2" />
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell>{record.departmentName}</TableCell>
                    <TableCell>{record.className}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.time}</TableCell>
                    <TableCell>{record.status}</TableCell>
                    <TableCell>{record.markedBy}</TableCell>
                    <TableCell className="text-center font-medium">{record.timesLate}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No records found for the selected criteria.
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

    