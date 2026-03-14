
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking 
} from '@/firebase';
import { EntryForm } from './_components/entry-form';
import { RecordsTable } from './_components/records-table';
import { Stats } from './_components/stats';
import type { LateRecord, Department, Class, Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  // Define memoized queries for each collection
  const deptsQuery = useMemoFirebase(() => query(collection(db, 'departments'), orderBy('name')), [db]);
  const classesQuery = useMemoFirebase(() => query(collection(db, 'classes'), orderBy('name')), [db]);
  const studentsQuery = useMemoFirebase(() => query(collection(db, 'students'), orderBy('name')), [db]);
  const recordsQuery = useMemoFirebase(() => query(collection(db, 'lateRecords'), orderBy('timestamp', 'desc')), [db]);

  // Use the useCollection hook for real-time data and automatic error handling
  const { data: rawDepts, isLoading: deptsLoading } = useCollection<Department>(deptsQuery);
  const { data: rawClasses, isLoading: classesLoading } = useCollection<Class>(classesQuery);
  const { data: rawStudents, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  const { data: rawRecords, isLoading: recordsLoading } = useCollection<LateRecord>(recordsQuery);

  // Normalize data and handle joins
  const departments = useMemo(() => rawDepts || [], [rawDepts]);
  const classes = useMemo(() => rawClasses || [], [rawClasses]);
  const students = useMemo(() => rawStudents || [], [rawStudents]);

  const processedRecords = useMemo(() => {
    if (!rawRecords || !students.length) return [];

    const studentsMap = new Map(students.map(s => [s.id, s]));
    const normalizeName = (name: string) => name?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
    const studentsByNameMap = new Map(students.map(s => [normalizeName(s.name), s]));

    return rawRecords.map((record) => {
      const timestamp = record.timestamp instanceof Timestamp ? record.timestamp.toDate() : new Date(record.timestamp);
      
      let student = studentsMap.get(record.studentId);
      if (!student && record.studentName) {
        student = studentsByNameMap.get(normalizeName(record.studentName));
      }

      return { 
        ...record,
        timestamp: timestamp,
        date: timestamp.toLocaleDateString(),
        status: record.status || 'Not Informed',
        studentId: student?.id || record.studentId || record.studentName,
        studentName: student?.name || record.studentName,
        registerNo: student?.registerNo || record.registerNo || '',
        gender: student?.gender || record.gender || 'MALE',
      } as LateRecord;
    });
  }, [rawRecords, students]);

  const handleAddRecord = async (newRecord: Omit<LateRecord, 'id' | 'timestamp'>) => {
    if (user?.role === 'viewer') {
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "Viewers are not allowed to mark students late.",
        });
        return false;
    }
      
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existingRecord = processedRecords.find(record => {
        const recordDate = new Date(record.timestamp);
        return record.studentId === newRecord.studentId && recordDate >= todayStart;
    });

    if (existingRecord) {
      toast({
          variant: "destructive",
          title: "Duplicate Entry",
          description: `${newRecord.studentName} has already been marked late today.`,
      });
      return false;
    }
    
    const timestamp = new Date();
    const recordWithTimestamp = {
      ...newRecord,
      timestamp: timestamp,
      date: timestamp.toLocaleDateString(),
    };

    // Use non-blocking utility for automatic error emission
    addDocumentNonBlocking(collection(db, 'lateRecords'), recordWithTimestamp);
    
    return true;
  };

  const initialDataLoading = deptsLoading || classesLoading || studentsLoading;

  if (initialDataLoading) {
      return (
        <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-[50vh] w-full" />
        </div>
      )
  }

  return (
    <div className="space-y-8">
      {user?.role !== 'viewer' && (
        <EntryForm 
          onAddRecord={handleAddRecord}
          departments={departments}
          classes={classes}
          students={students}
        />
      )}
      
      <Stats records={processedRecords} />
      <RecordsTable 
        records={processedRecords} 
        loading={recordsLoading}
        departments={departments}
        classes={classes}
        students={students}
      />
    </div>
  );
}
