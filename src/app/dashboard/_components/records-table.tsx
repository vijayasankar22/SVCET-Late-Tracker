"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import type { LateRecord } from "@/lib/types";
import { exportToCsv } from "@/lib/utils";
import { departments, classes } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type RecordsTableProps = {
  records: LateRecord[];
};

export function RecordsTable({ records }: RecordsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const availableClasses = useMemo(() => {
    if (departmentFilter === 'all') {
      return classes;
    }
    const dept = departments.find(d => d.name === departmentFilter);
    if (!dept) return [];
    return classes.filter(c => c.departmentId === dept.id);
  }, [departmentFilter]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((record) =>
        record.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((record) =>
        departmentFilter === "all" || record.departmentName === departmentFilter
      )
      .filter((record) =>
        classFilter === "all" || record.className === classFilter
      )
      .filter((record) => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) return true;
        const recordDate = new Date(record.date);
        if (dateRange.from && recordDate < dateRange.from) return false;
        if (dateRange.to && recordDate > dateRange.to) return false;
        return true;
      })
      .sort((a,b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());
  }, [records, searchTerm, departmentFilter, classFilter, dateRange]);

  const handleExport = () => {
    exportToCsv("late-records.csv", filteredRecords);
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
          <Button onClick={handleExport} disabled={filteredRecords.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
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
          <Select value={departmentFilter} onValueChange={handleDepartmentChange}>
            <SelectTrigger><SelectValue placeholder="Filter by Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter} disabled={departmentFilter === "all" && availableClasses.length === classes.length}>
            <SelectTrigger><SelectValue placeholder="Filter by Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {availableClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
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
                <TableHead className="font-bold text-primary">Marked By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell>{record.departmentName}</TableCell>
                    <TableCell>{record.className}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.time}</TableCell>
                    <TableCell>{record.markedBy}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No records found.
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
