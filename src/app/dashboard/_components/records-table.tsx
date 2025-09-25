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
    const studentLateCounts = records.reduce((acc, record) => {
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
    const pageWidth = doc.internal.pageSize.getWidth();

    const generatePdf = (img?: HTMLImageElement) => {
      let tableStartY = 20;
      if (img) {
        const newImgWidth = 182; // A larger width for the image
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        const newImgHeight = newImgWidth * aspectRatio;
        const imgX = (pageWidth - newImgWidth) / 2;
        const imgY = 1;
        doc.addImage(img, 'PNG', imgX, imgY, newImgWidth, newImgHeight);
        tableStartY = newImgHeight + imgY + 5; // Position content below the image
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text('STUDENTS LATE REPORT', pageWidth / 2, tableStartY, { align: 'center' });
      tableStartY += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const dateRangeText = `From: ${dateRange?.from ? format(dateRange.from, 'PPP') : 'N/A'}  To: ${dateRange?.to ? format(dateRange.to, 'PPP') : 'N/A'}`;
      doc.text(dateRangeText, pageWidth / 2, tableStartY, { align: 'center' });
      tableStartY += 10;

      autoTable(doc, {
        startY: tableStartY,
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
        headStyles: { fillColor: [30, 58, 138], lineColor: [44, 62, 80], lineWidth: 0.1 },
        styles: { cellPadding: 2, fontSize: 8, lineColor: [44, 62, 80], lineWidth: 0.1 },
      });

      doc.save("late-records.pdf");
    };

    try {
      const response = await fetch('/logo.png');
      if (!response.ok) throw new Error('Image not found');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
          const base64data = reader.result as string;
          const img = new Image();
          img.src = base64data;
          img.onload = () => {
              generatePdf(img);
          };
          img.onerror = () => {
              console.error("Could not load image for PDF.");
              generatePdf();
          };
      };
      reader.onerror = () => {
          console.error("Could not read image file.");
          generatePdf();
      }
    } catch (error) {
      console.error("Could not fetch image for PDF, generating without it.", error);
      generatePdf();
    }
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
