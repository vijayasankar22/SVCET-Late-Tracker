
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { errorEmitter, FirestorePermissionError, useFirestore } from '@/firebase';
import { collection, writeBatch, getDocs, doc } from 'firebase/firestore';
import { departments, classes, students } from '@/lib/data';

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const db = useFirestore();

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to access this page.',
      });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);

      // Clear and set departments
      const deptsRef = collection(db, 'departments');
      const deptsSnap = await getDocs(deptsRef);
      deptsSnap.forEach(d => batch.delete(d.ref));
      departments.forEach(dept => {
        batch.set(doc(deptsRef, dept.id), dept);
      });

      // Clear and set classes
      const classesRef = collection(db, 'classes');
      const classesSnap = await getDocs(classesRef);
      classesSnap.forEach(c => batch.delete(c.ref));
      classes.forEach(cls => {
        batch.set(doc(classesRef, cls.id), cls);
      });

      // Clear and set students
      const studentsRef = collection(db, 'students');
      const studentsSnap = await getDocs(studentsRef);
      studentsSnap.forEach(s => batch.delete(s.ref));
      students.forEach(student => {
        batch.set(doc(studentsRef, student.id), student);
      });

      await batch.commit();

      toast({
        title: 'Success',
        description: 'Database seeded successfully!',
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: 'root',
          operation: 'write',
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to seed database.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Seed Database</CardTitle>
          <CardDescription>
            Click the button to populate your database with initial data. This will add or overwrite existing entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-bold">Warning: This is a potentially destructive action.</p>
            <p>Running this will overwrite any existing departments, classes, or students in your database. Use with caution.</p>
          </div>
          <Button onClick={handleSeed} disabled={isLoading} variant="destructive" className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Data into Firestore'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
