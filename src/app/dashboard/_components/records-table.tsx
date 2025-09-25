
"use client";

import { useMemo, useState, useRef } from "react";
import Image from "next/image";
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });
  const logoImageRef = useRef<HTMLImageElement>(null);

  const availableClasses = useMemo(() => {
    if (departmentFilter === 'all') {
      return classes;
    }
    const dept = departments.find(d => d.id === departmentFilter);
    if (!dept) return [];
    return classes.filter(c => c.departmentId === dept.id);
  }, [departmentFilter, departments, classes]);

  const filteredRecords = useMemo(() => {
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
        if (!dateRange || !dateRange.from) {
          return true;
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
          console.error("Error filtering by date:", e);
          return true;
        }
      })
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
      
  }, [records, searchTerm, departmentFilter, classFilter, dateRange, departments, classes]);
  
  const studentLateCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    for (const record of records) {
        const key = record.studentId || record.studentName;
        counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [records]);


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
      timesLate: studentLateCounts[record.studentId || record.studentName] || 0,
    }));
    exportToCsv("late-records.csv", recordsToExport);
  };
  
 const handleExportPdf = () => {
    const generatePdf = (logoDataUrl: string | null) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let contentY = 15;

        if (logoDataUrl) {
            try {
                const originalWidth = logoImageRef.current!.naturalWidth;
                const originalHeight = logoImageRef.current!.naturalHeight;
                const aspectRatio = originalHeight / originalWidth;

                const imgWidth = pageWidth * (2 / 3);
                const imgHeight = imgWidth * aspectRatio;

                const x = (pageWidth - imgWidth) / 2;
                doc.addImage(logoDataUrl, 'PNG', x, contentY, imgWidth, imgHeight);
                contentY += imgHeight + 10;
            } catch (e) {
                console.error("Error adding image to PDF:", e);
            }
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("ACADEMIC YEAR 2025-26 | ODD SEM", pageWidth / 2, contentY, { align: "center" });
        contentY += 8;

        doc.setFontSize(16);
        const mainTitle = "STUDENTS LATE REPORT";
        doc.text(mainTitle, pageWidth / 2, contentY, { align: "center" });

        const textWidth = doc.getTextWidth(mainTitle);
        doc.setLineWidth(0.5);
        doc.line((pageWidth - textWidth) / 2, contentY + 1, (pageWidth + textWidth) / 2, contentY + 1);
        contentY += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const dateRangeText = `From: ${dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'N/A'}  To: ${dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'N/A'}`;
        doc.text(dateRangeText, pageWidth / 2, contentY, { align: 'center' });
        contentY += 10;

        autoTable(doc, {
            startY: contentY,
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
                (studentLateCounts[record.studentId || record.studentName] || 0).toString(),
            ]),
            headStyles: { fillColor: [30, 58, 138], lineColor: [44, 62, 80], lineWidth: 0.1 },
            styles: { cellPadding: 2, fontSize: 8, lineColor: [44, 62, 80], lineWidth: 0.1 },
        });

        doc.save("late-records.pdf");
    };
    
    if (logoImageRef.current && logoImageRef.current.complete) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = logoImageRef.current.naturalWidth;
            canvas.height = logoImageRef.current.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(logoImageRef.current, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                generatePdf(dataUrl);
            } else {
                 console.error("Could not get canvas context.");
                 generatePdf(null);
            }
        } catch (e) {
            console.error("Error creating data URL from image:", e);
            generatePdf(null);
        }
    } else {
        console.error("Logo image not loaded or not found.");
        generatePdf(null);
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                 <CardTitle className="font-headline text-2xl">Late Entry Records</CardTitle>
                <CardDescription>View, filter, and export late student records.</CardDescription>
            </div>
            <div className="flex gap-2">
                <img 
                    ref={logoImageRef} 
                    src="/svcet-logo-PNG-scaled (1).png"
                    crossOrigin="anonymous" 
                    className="hidden" 
                    alt="logo" 
                />
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
            <Select value={classFilter} onValueChange={(value) => {
                setClassFilter(value);
            }}>
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
                                <span className={`font-bold ${ (studentLateCounts[record.studentId || record.studentName] || 0) >= 3 ? 'text-destructive' : 'text-primary'}`}>{studentLateCounts[record.studentId || record.studentName] || 0}</span>
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

    