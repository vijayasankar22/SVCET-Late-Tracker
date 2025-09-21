"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EntryForm } from './_components/entry-form';
import { RecordsTable } from './_components/records-table';
import { Stats } from './_components/stats';
import type { LateRecord, Department, Class, Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [records, setRecords] = useState<LateRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialDataLoading(true);
        const [depts, clss, studs, recs] = await Promise.all([
          getDocs(query(collection(db, 'departments'), orderBy('name'))),
          getDocs(query(collection(db, 'classes'), orderBy('name'))),
          getDocs(query(collection(db, 'students'), orderBy('name'))),
          getDocs(query(collection(db, 'lateRecords'), orderBy('timestamp', 'desc')))
        ]);

        const deptsData = depts.docs.map(doc => doc.data() as Department);
        const clssData = clss.docs.map(doc => doc.data() as Class);
        const studsData = studs.docs.map(doc => doc.data() as Student);
        
        const fetchedRecords: LateRecord[] = recs.docs.map((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp);
          return { 
            id: doc.id, 
            ...data,
            timestamp: timestamp,
            date: timestamp.toLocaleDateString(),
            status: data.status || 'Not Informed', // backward compatibility
          } as LateRecord;
        });

        setDepartments(deptsData);
        setClasses(clssData);
        setStudents(studsData);
        setRecords(fetchedRecords);

        if (deptsData.length === 0) {
            toast({
                variant: "destructive",
                title: "Data Missing",
                description: "No departments found. Please seed the database from the /seed page.",
            });
        }

      } catch (error) {
        console.error("Error fetching initial data: ", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch data from the database. Please ensure Firestore is set up correctly and you have seeded the data.",
        });
      } finally {
        setLoading(false);
        setInitialDataLoading(false);
      }
    };

    fetchInitialData();
  }, [toast]);

  const handleAddRecord = async (newRecord: Omit<LateRecord, 'id' | 'timestamp'>) => {
    try {
      const timestamp = new Date();
      const recordWithTimestamp = {
        ...newRecord,
        timestamp: timestamp,
        date: timestamp.toLocaleDateString(),
      };
      const docRef = await addDoc(collection(db, 'lateRecords'), recordWithTimestamp);

      setRecords((prevRecords) => [{ id: docRef.id, ...recordWithTimestamp, timestamp: timestamp } as LateRecord, ...prevRecords]);
      return true;
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save the new record.",
      });
      return false;
    }
  };

  if (initialDataLoading) {
      return (
        <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <EntryForm 
        onAddRecord={handleAddRecord}
        departments={departments}
        classes={classes}
        students={students}
       />
       <Stats records={records} />
      <RecordsTable 
        records={records} 
        loading={loading}
        departments={departments}
        classes={classes}
      />
    </div>
  );
}
