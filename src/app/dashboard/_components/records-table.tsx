
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, FileDown, History, X, ArrowUp, ArrowDown } from "lucide-react";
import type { LateRecord, Department, Class, Student } from "@/lib/types";
import { exportToCsv } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";

type LateRecordWithPeriodCount = LateRecord & { lateInPeriod: number };
type SortableKeys = keyof LateRecordWithPeriodCount | 'mentor' | 'totalLate';
type SortConfig = { key: SortableKeys; direction: 'ascending' | 'descending' };


type RecordsTableProps = {
  records: LateRecord[];
  loading: boolean;
  departments: Department[];
  classes: Class[];
  students: Student[];
};

export function RecordsTable({ records, loading, departments, classes, students }: RecordsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [mentorFilter, setMentorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<LateRecord[] | null>(null);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);

  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'timestamp', direction: 'descending' });

  useEffect(() => {
    fetch('/svcet-head.png')
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }).catch(error => {
        console.error("Error fetching or converting logo:", error);
      });
  }, []);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const globalSearchResults = useMemo(() => {
    if (!globalSearchTerm) return [];
    return students.filter(student =>
      student.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      student.registerNo?.toLowerCase().includes(globalSearchTerm.toLowerCase())
    ).slice(0, 10);
  }, [globalSearchTerm, students]);

  const recordsInDateRange = useMemo(() => {
     return records.filter((record) => {
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
      });
  }, [records, dateRange]);

   const recordsWithCumulativeCounts = useMemo(() => {
    const sortedRecords = [...recordsInDateRange].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const studentCounts: { [studentId: string]: number } = {};
    return sortedRecords.map(record => {
      const studentId = record.studentId;
      studentCounts[studentId] = (studentCounts[studentId] || 0) + 1;
      return { ...record, lateInPeriod: studentCounts[studentId] };
    });
  }, [recordsInDateRange]);

  const studentLateCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    for (const record of records) {
        if (record.studentId) {
            counts[record.studentId] = (counts[record.studentId] || 0) + 1;
        }
    }
    return counts;
  }, [records]);


  const handleGlobalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalSearchTerm(e.target.value);
    if (e.target.value.length > 0) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setGlobalSearchTerm('');
    setShowSearchResults(false);
    const history = records.filter(
      (record) => record.studentId === student.id
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setSelectedStudentForHistory(student);
    setSelectedStudentHistory(history);
  };

  const handleRowClick = (record: LateRecord) => {
    const student = students.find(s => s.id === record.studentId);
    if (student) {
        handleStudentSelect(student);
    }
  };

  const availableClasses = useMemo(() => {
    if (departmentFilter === 'all') {
      return classes;
    }
    const dept = departments.find(d => d.id === departmentFilter);
    if (!dept) return [];
    return classes.filter(c => c.departmentId === dept.id);
  }, [departmentFilter, departments, classes]);

  useEffect(() => {
    setClassFilter('all');
  }, [departmentFilter]);

  const mentors = useMemo(() => {
    const mentorSet = new Set<string>();
    students.forEach(student => {
      if (student.mentor) {
        mentorSet.add(student.mentor);
      }
    });
    return Array.from(mentorSet).sort();
  }, [students]);

  const filteredRecords: LateRecordWithPeriodCount[] = useMemo(() => {
    let sortableRecords = [...recordsWithCumulativeCounts];

    if (sortConfig.key) {
        sortableRecords.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (sortConfig.key === 'mentor') {
                aValue = students.find(s => s.id === a.studentId)?.mentor || 'N/A';
                bValue = students.find(s => s.id === b.studentId)?.mentor || 'N/A';
            } else if (sortConfig.key === 'totalLate') {
                aValue = studentLateCounts[a.studentId] || 0;
                bValue = studentLateCounts[b.studentId] || 0;
            } else {
                aValue = a[sortConfig.key as keyof LateRecordWithPeriodCount];
                bValue = b[sortConfig.key as keyof LateRecordWithPeriodCount];
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }


    return sortableRecords
      .filter((record) =>
        record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.registerNo && record.registerNo.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter((record) =>
        departmentFilter === "all" || record.departmentName === departments.find(d => d.id === departmentFilter)?.name
      )
      .filter((record) =>
        classFilter === "all" || record.className === classes.find(c => c.id === classFilter)?.name
      )
      .filter((record) => {
        if (mentorFilter === 'all') return true;
        const student = students.find(s => s.id === record.studentId);
        return student?.mentor === mentorFilter;
      })
      .filter((record) =>
        statusFilter === "all" || record.status === statusFilter
      )
      .filter((record) =>
        genderFilter === 'all' || record.gender === genderFilter
      );
      
  }, [recordsWithCumulativeCounts, searchTerm, departmentFilter, classFilter, mentorFilter, statusFilter, genderFilter, departments, classes, students, sortConfig, studentLateCounts]);
  
  const handleExportCsv = () => {
    const recordsToExport = filteredRecords.map((record, index) => {
      const student = students.find(s => s.id === record.studentId);
      return {
        "S.No.": index + 1,
        registerNo: record.registerNo,
        studentName: record.studentName,
        gender: record.gender,
        departmentName: record.departmentName,
        className: record.className,
        mentor: student?.mentor || 'N/A',
        date: record.date,
        time: record.time,
        status: record.status,
        "Late in Period": record.lateInPeriod,
        "Total Late Entries": studentLateCounts[record.studentId] || 0,
      }
    });
    exportToCsv("late-records.csv", recordsToExport);
  };
  
 const handleExportPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let contentY = 10;
  
    const drawContent = () => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("ACADEMIC YEAR 2025-26 | ODD SEM", pageWidth / 2, contentY, { align: "center" });
        contentY += 16;
    
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
          head: [['S.No.', 'Register No.', 'Student Name', 'Gender', 'Department', 'Class', 'Mentor', 'Date', 'Time', 'Status', 'Late in Period', 'Total Late']],
          body: filteredRecords.map((record, index) => {
              const student = students.find(s => s.id === record.studentId);
              return [
                index + 1,
                record.registerNo,
                record.studentName,
                record.gender,
                record.departmentName,
                record.className,
                student?.mentor || 'N/A',
                record.date,
                record.time,
                record.status,
                record.lateInPeriod,
                (studentLateCounts[record.studentId] || 0).toString(),
              ]
          }),
          headStyles: { fillColor: [30, 58, 138], lineColor: [44, 62, 80], lineWidth: 0.1 },
          styles: { cellPadding: 2, fontSize: 8, lineColor: [44, 62, 80], lineWidth: 0.1 },
        });
    
        doc.save("late-records.pdf");
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
            contentY += imgHeight;
            drawContent();
        };
        img.onerror = () => {
            console.error("Error loading image for PDF.");
            drawContent(); // Proceed without the image if it fails
        };
      } catch (e) {
        console.error("Error adding image to PDF:", e);
        drawContent();
      }
    } else {
        drawContent();
    }
  };

  const handleHistoryExportPdf = () => {
    if (!selectedStudentHistory || !selectedStudentForHistory) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let contentY = 10;
  
    const drawContent = () => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Late Entry History Report", pageWidth / 2, contentY, { align: "center" });
        contentY += 8;
    
        doc.setFontSize(12);
        const studentInfo = `${selectedStudentForHistory!.name} | ${selectedStudentForHistory!.registerNo || 'N/A'}`;
        doc.text(studentInfo, pageWidth / 2, contentY, { align: 'center' });
        contentY += 10;
    
        autoTable(doc, {
          startY: contentY,
          head: [['S.No.', 'Date', 'Time', 'Status', 'Marked By']],
          body: selectedStudentHistory!.map((record, index) => [
            index + 1,
            record.date,
            record.time,
            record.status,
            record.markedBy,
          ]),
          headStyles: { fillColor: [30, 58, 138], lineColor: [44, 62, 80], lineWidth: 0.1 },
          styles: { cellPadding: 2, fontSize: 10, lineColor: [44, 62, 80], lineWidth: 0.1 },
        });
    
        doc.save(`${selectedStudentForHistory!.name}_late_history.pdf`);
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


  const getStatusClass = (status: LateRecord['status']) => {
    switch (status) {
      case 'Informed':
        return 'bg-green-100 text-green-800';
      case 'Not Informed':
        return 'bg-yellow-100 text-yellow-800';
      case 'Letter Given':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ sortKey, children }: { sortKey: SortableKeys; children: React.ReactNode }) => {
    const isSorted = sortConfig.key === sortKey;
    const isAsc = sortConfig.direction === 'ascending';
    
    return (
        <TableHead onClick={() => requestSort(sortKey)} className="cursor-pointer hover:bg-accent/50">
            <div className="flex items-center gap-2">
                {children}
                {isSorted ? (isAsc ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />) : <ArrowUp className="h-4 w-4 text-muted-foreground/50" />}
            </div>
        </TableHead>
    );
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                   <CardTitle className="font-headline text-2xl">Student Records</CardTitle>
                  <CardDescription>Search for any student to view their history, or filter the records table below.</CardDescription>
              </div>
              <div className="flex gap-2">
                  <Button onClick={handleExportCsv} size="sm">
                      <FileDown />
                      Export CSV
                  </Button>
                   <Button onClick={handleExportPdf} size="sm">
                      <Download />
                      Export PDF
                  </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div ref={searchRef} className="relative w-full max-w-lg mx-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search any student by name or register no..."
                className="pl-8 w-full"
                value={globalSearchTerm}
                onChange={handleGlobalSearchChange}
                onFocus={() => globalSearchTerm && setShowSearchResults(true)}
              />
              {showSearchResults && globalSearchResults.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                  <CardContent className="p-2">
                    {globalSearchResults.map(student => (
                      <div key={student.id} onClick={() => handleStudentSelect(student)} className="p-2 hover:bg-accent/50 rounded-md cursor-pointer text-sm">
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.registerNo} - {students.find(s=> s.id === student.id)?.classId}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />
            <p className="text-sm text-center text-muted-foreground">Or, filter the late entry records table:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                <div className="relative lg:col-span-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Filter current records..."
                    className="pl-8 sm:w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                 <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
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
                      <div className="flex flex-col space-y-2 p-2">
                        <div className="flex flex-wrap items-center gap-2">
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
                            numberOfMonths={1}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-full">
                          <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select value={classFilter} onValueChange={setClassFilter} disabled={departmentFilter === 'all'}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Class" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {availableClasses.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select value={mentorFilter} onValueChange={setMentorFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Mentor" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Mentors</SelectItem>
                          {mentors.map(mentor => (
                              <SelectItem key={mentor} value={mentor}>{mentor}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                          <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Informed">Informed</SelectItem>
                          <SelectItem value="Not Informed">Not Informed</SelectItem>
                          <SelectItem value="Letter Given">Letter Given</SelectItem>
                      </SelectContent>
                  </Select>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger className="w-full">
                          <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </div>


          <div className="rounded-lg border">
            <Table className="table-alternating-rows">
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey="id">S.No.</SortableHeader>
                  <SortableHeader sortKey="registerNo">Register No.</SortableHeader>
                  <SortableHeader sortKey="studentName">Student Name</SortableHeader>
                  <SortableHeader sortKey="gender">Gender</SortableHeader>
                  <SortableHeader sortKey="departmentName">Department</SortableHeader>
                  <SortableHeader sortKey="className">Class</SortableHeader>
                  <SortableHeader sortKey="mentor">Mentor</SortableHeader>
                  <SortableHeader sortKey="date">Date</SortableHeader>
                  <SortableHeader sortKey="time">Time</SortableHeader>
                  <SortableHeader sortKey="status">Status</SortableHeader>
                  <SortableHeader sortKey="lateInPeriod">Late in Period</SortableHeader>
                  <SortableHeader sortKey="totalLate">Total Late</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                              <TableCell colSpan={12}><Skeleton className="h-6" /></TableCell>
                          </TableRow>
                      ))
                  ) : filteredRecords.length > 0 ? (
                      filteredRecords.map((record, index) => {
                        const student = students.find(s => s.id === record.studentId);
                        return (
                        <TableRow key={record.id} onClick={() => handleRowClick(record)} className="cursor-pointer">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{record.registerNo || "N/A"}</TableCell>
                            <TableCell className="font-medium">{record.studentName}</TableCell>
                            <TableCell>{record.gender}</TableCell>
                            <TableCell>{record.departmentName}</TableCell>
                            <TableCell>{record.className}</TableCell>
                            <TableCell>{student?.mentor || 'N/A'}</TableCell>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.time}</TableCell>
                             <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(record.status)}`}>
                                    {record.status}
                                </span>
                            </TableCell>
                             <TableCell>
                                <span className={`font-bold ${ record.lateInPeriod > 3 ? 'text-destructive' : 'text-primary'}`}>{record.lateInPeriod}</span>
                            </TableCell>
                            <TableCell>
                                <span className={`font-bold ${ (studentLateCounts[record.studentId] || 0) > 3 ? 'text-destructive' : 'text-primary'}`}>{studentLateCounts[record.studentId] || 0}</span>
                            </TableCell>
                        </TableRow>
                      )})
                  ) : (
                       <TableRow>
                          <TableCell colSpan={12} className="text-center">
                              No records found for the selected filters.
                          </TableCell>
                      </TableRow>
                  )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {selectedStudentHistory && selectedStudentForHistory && (
        <Dialog open={!!selectedStudentHistory} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setSelectedStudentHistory(null);
                setSelectedStudentForHistory(null);
            }
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-6 w-6" /> 
                Late Entry History for {selectedStudentForHistory.name}
              </DialogTitle>
              <DialogDescription>
                Register No: {selectedStudentForHistory.registerNo || "N/A"} | Total late entries: {studentLateCounts[selectedStudentForHistory.id] || 0}
              </DialogDescription>
            </DialogHeader>
             {selectedStudentHistory.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Marked By</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {selectedStudentHistory.map((entry) => (
                        <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.time}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(entry.status)}`}>
                            {entry.status}
                            </span>
                        </TableCell>
                        <TableCell>{entry.markedBy}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            ) : (
                <div className="text-center p-8">
                    <p>No late entries found for this student.</p>
                </div>
             )}
            <DialogFooter>
                <Button onClick={handleHistoryExportPdf} disabled={selectedStudentHistory.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
