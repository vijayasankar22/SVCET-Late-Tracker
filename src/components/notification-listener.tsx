
'use client';

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

export function RealtimeNotificationListener() {
  const { toast } = useToast();
  const { user } = useAuth();
  const initialLoadTime = useRef(new Date());

  useEffect(() => {
    if (user?.role !== 'viewer') {
      return;
    }

    const recordsCollection = collection(db, 'lateRecords');
    const q = query(recordsCollection, where('timestamp', '>', Timestamp.fromDate(initialLoadTime.current)));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newRecord = change.doc.data();
          // Ensure we don't notify for records that existed just before listener attached
          const recordTimestamp = newRecord.timestamp.toDate();
          if(recordTimestamp > initialLoadTime.current) {
            toast({
              title: 'New Late Entry',
              description: `${newRecord.studentName} from ${newRecord.className} was just marked late.`,
            });
          }
        }
      });
    }, (error) => {
        console.error("Error with real-time listener:", error);
    });

    return () => {
      unsubscribe();
    };

  }, [toast, user?.role]);

  return null;
}
