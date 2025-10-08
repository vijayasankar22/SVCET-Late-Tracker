
'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Department, Student, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToCsv } from '@/lib/utils';

type ClassStrength = {
  classId: string;
  className: string;
  boys: number;
  girls: number;
  total: number;
};

type DepartmentStrength = {
  [departmentName: string]: {
    classes: ClassStrength[];
    total: number;
    totalBoys: number;
    totalGirls: number;
  };
};

export default function ClassStrengthPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [selectedClassStudents, setSelectedClassStudents] = useState<Student[]>([]);
  const [selectedClassInfo, setSelectedClassInfo] = useState<{className: string; deptName: string} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

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
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [depts, studs, clss] = await Promise.all([
          getDocs(query(collection(db, 'departments'), orderBy('name'))),
          getDocs(query(collection(db, 'students'))),
          getDocs(collection(db, 'classes')),
        ]);

        const deptsData = depts.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        const studsData = studs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        const clssData = clss.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));

        setDepartments(deptsData);
        setStudents(studsData);
        setClasses(clssData);

      } catch (error) {
        console.error("Error fetching initial data: ", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch data for class strength. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [toast]);

  const strengthData = useMemo(() => {
    if (loading || !students.length || !classes.length || !departments.length) {
      return {};
    }

    const data: DepartmentStrength = {};

    departments.forEach(dept => {
      data[dept.name] = { classes: [], total: 0, totalBoys: 0, totalGirls: 0 };
      const deptClasses = classes.filter(c => c.departmentId === dept.id).sort((a,b) => a.name.localeCompare(b.name));
      let departmentTotal = 0;
      let departmentBoys = 0;
      let departmentGirls = 0;

      deptClasses.forEach(cls => {
        const classStudents = students.filter(s => s.classId === cls.id);
        const boys = classStudents.filter(s => s.gender === 'MALE').length;
        const girls = classStudents.filter(s => s.gender === 'FEMALE').length;
        const total = boys + girls;
        
        departmentTotal += total;
        departmentBoys += boys;
        departmentGirls += girls;

        data[dept.name].classes.push({
          classId: cls.id,
          className: cls.name,
          boys,
          girls,
          total,
        });
      });
      data[dept.name].total = departmentTotal;
      data[dept.name].totalBoys = departmentBoys;
      data[dept.name].totalGirls = departmentGirls;
    });

    return data;
  }, [students, classes, departments, loading]);

  const handleClassClick = (classId: string, className: string, deptName: string) => {
    const classStudents = students.filter(s => s.classId === classId).sort((a, b) => (a.registerNo || '').localeCompare(b.registerNo || ''));
    setSelectedClassStudents(classStudents);
    setSelectedClassInfo({ className, deptName });
    setIsDialogOpen(true);
  };
  
  const handleExportPdf = () => {
    if (!selectedClassInfo || !selectedClassStudents.length) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let contentY = 10;
  
    const drawContent = () => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("STUDENT LIST", pageWidth / 2, contentY, { align: "center" });
        contentY += 8;
    
        doc.setFontSize(12);
        const subTitle = `${selectedClassInfo?.deptName} - ${selectedClassInfo?.className}`;
        doc.text(subTitle, pageWidth / 2, contentY, { align: 'center' });
        contentY += 10;
    
        autoTable(doc, {
          startY: contentY,
          head: [['S.No.', 'Register No.', 'Student Name']],
          body: selectedClassStudents.map((student, index) => [
            index + 1,
            student.registerNo,
            student.name,
          ]),
          headStyles: { fillColor: [30, 58, 138], lineColor: [44, 62, 80], lineWidth: 0.1 },
          styles: { cellPadding: 2, fontSize: 10, lineColor: [44, 62, 80], lineWidth: 0.1 },
        });
    
        doc.save(`${selectedClassInfo?.deptName}_${selectedClassInfo?.className}_students.pdf`);
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

  const handleExportCsv = () => {
    if (!selectedClassInfo || !selectedClassStudents.length) return;

    const rows = selectedClassStudents.map((student, index) => ({
      "S.No.": index + 1,
      "Register No.": student.registerNo,
      "Student Name": student.name,
    }));

    exportToCsv(`${selectedClassInfo.deptName}_${selectedClassInfo.className}_students.csv`, rows);
  };


  if (loading) {
    return (
        <div className="space-y-8">
            <div className='flex items-center justify-between'>
                 <Skeleton className="h-8 w-64" />
                 <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({length: 6}).map((_, i) => (
                     <Skeleton key={i} className="h-64 w-full" />
                ))}
            </div>
        </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
              <h1 className="text-2xl font-headline font-bold">Class Strength</h1>
              <p className="text-muted-foreground">Student count for each class, broken down by gender.</p>
          </div>
          <Link href="/dashboard">
              <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
              </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(strengthData).map(([deptName, deptData]) => (
            <Card key={deptName}>
              <CardHeader>
                <CardTitle>{deptName}</CardTitle>
                <p className="text-sm text-muted-foreground">Total Strength: {deptData.total}</p>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                      <TableRow>
                          <TableHead>Class</TableHead>
                          <TableHead className='text-center'>Boys</TableHead>
                          <TableHead className='text-center'>Girls</TableHead>
                          <TableHead className='text-center'>Total</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {deptData.classes.map(cs => (
                          <TableRow key={cs.classId} onClick={() => handleClassClick(cs.classId, cs.className, deptName)} className="cursor-pointer">
                            <TableCell className='font-medium'>{cs.className}</TableCell>
                            <TableCell className='text-center'>{cs.boys}</TableCell>
                            <TableCell className='text-center'>{cs.girls}</TableCell>
                            <TableCell className='text-center font-bold'>{cs.total}</TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
              </CardContent>
              <CardFooter className="bg-accent text-accent-foreground p-4">
                  <Table>
                      <TableBody>
                          <TableRow className='border-none hover:bg-transparent'>
                              <TableCell className="font-bold">Department Total</TableCell>
                              <TableCell className="text-center font-bold">{deptData.totalBoys}</TableCell>
                              <TableCell className="text-center font-bold">{deptData.totalGirls}</TableCell>
                              <TableCell className="text-center font-bold">{deptData.total}</TableCell>
                          </TableRow>
                      </TableBody>
                  </Table>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Student List</DialogTitle>
            {selectedClassInfo && (
              <DialogDescription>
                {selectedClassInfo.deptName} - {selectedClassInfo.className}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No.</TableHead>
                  <TableHead>Register No.</TableHead>
                  <TableHead>Student Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedClassStudents.length > 0 ? (
                  selectedClassStudents.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{student.registerNo}</TableCell>
                      <TableCell>{student.name}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">No students found in this class.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={handleExportCsv} variant="outline" disabled={!selectedClassStudents.length}>
              <FileDown className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button onClick={handleExportPdf} disabled={!selectedClassStudents.length}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
