"use client";

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EntryForm } from './_components/entry-form';
import { RecordsTable } from './_components/records-table';
import type { LateRecord } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [records, setRecords] = useState<LateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const q = query(collection(db, 'lateRecords'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedRecords: LateRecord[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Make sure timestamp is a JS Date object for consistency
          const record = { 
            id: doc.id, 
            ...data,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)
          } as LateRecord;
          fetchedRecords.push(record);
        });
        setRecords(fetchedRecords);
      } catch (error) {
        console.error("Error fetching records: ", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch records from the database. Please ensure Firestore is set up correctly.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [toast]);

  const handleAddRecord = async (newRecord: Omit<LateRecord, 'id' | 'timestamp'>) => {
    try {
      const timestamp = new Date();
      const docRef = await addDoc(collection(db, 'lateRecords'), {
        ...newRecord,
        timestamp: timestamp,
      });
      setRecords((prevRecords) => [{ id: docRef.id, ...newRecord, timestamp: timestamp } as LateRecord, ...prevRecords]);
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

  return (
    <div className="space-y-8">
      <EntryForm onAddRecord={handleAddRecord} />
      <RecordsTable records={records} loading={loading} />
    </div>
  );
}
