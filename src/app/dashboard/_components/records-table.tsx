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
    const collegeLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABwgAAAcICAYAAAAok5WGAAAACXBIWXMAAC4jAAAuIwF4pT92AACb12lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4wLWMwMDEgNzkuMTRlY2I0MiwgMjAyMi8xMi8wMi0xOToxMjo0NCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI0LjIgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wOS0xOVQxMzozNDoxMyswNTozMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNS0wOS0xOVQxMzozNDoxMyswNTozMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDktMTlUMTM6MzQ6MTMrMDU6MzAiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MjkzMGExYzItNTJiZC04YzQ2LWE5ZDQtNjlkYmFmMzlkZmI5IiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6MzdiMTg0OTctMjU2YS04MTQ5LTgzMGYtNTEyOTFkYjExMzgzIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ODk2ZjY0MTQtZjY4OS1jYjRlLWE0NzUtMzA1YzEwMTM0MDg5IiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODk2ZjY0MTQtZjY4OS1jYjRlLWE0NzUtMzA1YzEwMTM0MDg5IiBzdEV2dDp3aGVuPSIyMDI1LTA5LTE5VDEzOjM0OjEzKzA1OjMwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjQuMiAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY1Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjI5MzBhMWMyLTUyYmQtOGM0Ni1hOWQ0LTY5ZGJhZjM5ZGZiOSIgc3RFdnQ6d2hlbj0iMjAyNS0wOS0xOVQxMzozNDoxMyswNTozMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjIgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT4wMDZBOTFBRUIyNDdGRUU4MDhBQUVGM0VERTBCQ0U4QzwvcmRmOmxpPiA8cmRmOmxpPjAxRDUwMkM0OUY4NUVCRjcyQTIwNEU1NzNCMURBNEZDPC9yZGY6bGk+IDxyZGY6bGk+MDFFQTAyODQ1OEM2NUI5MjQ1Q0M2MUI1RjU4MEIzNjQ8L3JkZjpsaT4gPHJkZjpsaT4wMzkzMjYxNzZCNUZEQzU4QjQxQUQxNTM0OEQ3QjA2MTwvcmRmOmxpPiA8cmRmOmxpPjAzOTM3QkFBNjQyMUUyNTlFNzdFQUZBMzg1RkY0Qzc0PC9yZGY6bGk+IDxyZGY6bGk+MDY3RDI0OEQ5NjQ4MTE1RDA5RUFEMkMyNTNERDVBMEI8L3JkZjpsaT4gPHJkZjpsaT4wNkY2MkVCNEEzRjk5QzVBMEE5QzA5NDA4QkNGRUI3NDwvcmRmOmxpPiA8cmRmOmxpPjA5NEI0M0E2RkQyMEI5MDRDMjMzOERBMTkyRThEMTBGPC9yZGY6bGk+IDxyZGY6bGk+MEFCNEUxRDFCNjY0REZCQTQzRUUzNDgxRDlBODAxM0Y8L3JkZjpsaT4gPHJkZjpsaT4wQkM2ODdGODBFRjM5MDIyQkVFN0MwMkE5M0Y3ODk3NzwvcmRmOmxpPiA8cmRmOmxpPjBDOEIwMzlGNkJEN0VCOUZEQTkwN0JERDhGMjI2Q0UxPC9yZGY6bGk}+'
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

    