
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LateEntriesChart } from './_components/late-entries-chart';
import { TopLatecomersList } from './_components/top-latecomers-list';
import type { LateRecord, Department, Student, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DayWiseChart } from './_components/day-wise-chart';

export default function AnalyticsPage() {
  const [records, setRecords] = useState<LateRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [depts, studs, recs, clss] = await Promise.all([
          getDocs(query(collection(db, 'departments'), orderBy('name'))),
          getDocs(query(collection(db, 'students'))),
          getDocs(query(collection(db, 'lateRecords'), orderBy('timestamp', 'desc'))),
          getDocs(collection(db, 'classes')),
        ]);

        const deptsData = depts.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        const studsData = studs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        const clssData = clss.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
        
        const fetchedRecords: LateRecord[] = recs.docs.map((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp);
          
          return { 
            id: doc.id, 
            ...data,
            timestamp: timestamp,
          } as LateRecord;
        });

        setDepartments(deptsData);
        setRecords(fetchedRecords);
        setStudents(studsData);
        setClasses(clssData);

      } catch (error) {
        console.error("Error fetching initial data: ", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch data for analytics. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [toast]);


  return (
    <div className="space-y-8">
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
            <h1 className="text-2xl font-headline font-bold">Late Entry Analytics</h1>
        </div>
        <Link href="/dashboard">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
        </Link>
      </div>
     
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardContent className="pt-6">
                {loading ? (
                    <Skeleton className="h-[400px] w-full" />
                ) : (
                    <LateEntriesChart records={records} departments={departments} />
                )}
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6">
                {loading ? (
                    <Skeleton className="h-[400px] w-full" />
                ) : (
                    <DayWiseChart records={records} departments={departments} />
                )}
            </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardContent className="pt-6">
               {loading ? (
                  <Skeleton className="h-[400px] w-full" />
              ) : (
                  <TopLatecomersList records={records} students={students} departments={departments} classes={classes} />
              )}
          </CardContent>
      </Card>
    </div>
  );
}
