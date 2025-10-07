
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LateEntriesChart } from './_components/late-entries-chart';
import { TopLatecomersList } from './_components/top-latecomers-list';
import type { LateRecord, Department, Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AnalyticsPage() {
  const [records, setRecords] = useState<LateRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [depts, recs, studs] = await Promise.all([
          getDocs(query(collection(db, 'departments'), orderBy('name'))),
          getDocs(query(collection(db, 'lateRecords'), orderBy('timestamp', 'desc'))),
          getDocs(query(collection(db, 'students'))),
        ]);

        const deptsData = depts.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        const studsData = studs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        
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
        <Link href="/dashboard">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
        </Link>
        <Card>
            <CardHeader>
                <CardTitle>Late Entry Analytics</CardTitle>
                <CardDescription>Visualizing late entry data across departments and identifying top latecomers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {loading ? (
                    <Skeleton className="h-[400px] w-full" />
                ) : (
                    <LateEntriesChart records={records} departments={departments} />
                )}
                <Separator />
                 {loading ? (
                    <Skeleton className="h-[400px] w-full" />
                ) : (
                    <TopLatecomersList records={records} students={students} departments={departments} classes={[]} />
                )}
            </CardContent>
        </Card>
    </div>
  );
}
