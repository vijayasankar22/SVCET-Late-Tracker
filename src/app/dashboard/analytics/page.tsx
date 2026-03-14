
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { LateEntriesChart } from './_components/late-entries-chart';
import { TopLatecomersList } from './_components/top-latecomers-list';
import type { LateRecord, Department, Student, Class } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DayWiseChart } from './_components/day-wise-chart';

export default function AnalyticsPage() {
  const db = useFirestore();
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
      }).catch(() => {
        // Quiet failure for logo
      });
  }, []);

  const deptsQuery = useMemoFirebase(() => query(collection(db, 'departments'), orderBy('name')), [db]);
  const studsQuery = useMemoFirebase(() => query(collection(db, 'students')), [db]);
  const clssQuery = useMemoFirebase(() => query(collection(db, 'classes')), [db]);
  const recsQuery = useMemoFirebase(() => query(collection(db, 'lateRecords'), orderBy('timestamp', 'desc')), [db]);

  const { data: rawDepts, isLoading: deptsLoading } = useCollection<Department>(deptsQuery);
  const { data: rawStuds, isLoading: studsLoading } = useCollection<Student>(studsQuery);
  const { data: rawClss, isLoading: clssLoading } = useCollection<Class>(clssQuery);
  const { data: rawRecs, isLoading: recsLoading } = useCollection<LateRecord>(recsQuery);

  const departments = useMemo(() => rawDepts || [], [rawDepts]);
  const students = useMemo(() => rawStuds || [], [rawStuds]);
  const classes = useMemo(() => rawClss || [], [rawClss]);

  const processedRecords = useMemo(() => {
    if (!rawRecs) return [];
    return rawRecs.map((doc) => {
      const timestamp = doc.timestamp instanceof Timestamp ? doc.timestamp.toDate() : new Date(doc.timestamp);
      return { 
        ...doc,
        timestamp: timestamp,
      } as LateRecord;
    });
  }, [rawRecs]);

  const loading = deptsLoading || studsLoading || clssLoading || recsLoading;

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
                    <LateEntriesChart records={processedRecords} departments={departments} />
                )}
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6">
                {loading ? (
                    <Skeleton className="h-[400px] w-full" />
                ) : (
                    <DayWiseChart records={processedRecords} departments={departments} />
                )}
            </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardContent className="pt-6">
               {loading ? (
                  <Skeleton className="h-[400px] w-full" />
              ) : (
                  <TopLatecomersList records={processedRecords} students={students} departments={departments} classes={classes} logoBase64={logoBase64} />
              )}
          </CardContent>
      </Card>
    </div>
  );
}
