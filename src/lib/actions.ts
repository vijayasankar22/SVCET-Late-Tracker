
'use server';

import { collection, writeBatch, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { departments, classes, students } from '@/lib/data';

export type SeedResult = {
  success: boolean;
  message: string;
  isPermissionError?: boolean;
  errorContext?: any;
};

export async function seedDatabase(): Promise<SeedResult> {
  try {
    const batch = writeBatch(db);

    const departmentsCollection = collection(db, 'departments');
    const existingDepts = await getDocs(departmentsCollection);
    existingDepts.forEach(doc => batch.delete(doc.ref));
    for (const dept of departments) {
      const docRef = doc(departmentsCollection, dept.id);
      batch.set(docRef, dept);
    }

    const classesCollection = collection(db, 'classes');
    const existingClasses = await getDocs(classesCollection);
    existingClasses.forEach(doc => batch.delete(doc.ref));
    for (const cls of classes) {
      const docRef = doc(classesCollection, cls.id);
      batch.set(docRef, cls);
    }

    const studentsCollection = collection(db, 'students');
    const existingStudents = await getDocs(studentsCollection);
    existingStudents.forEach(doc => batch.delete(doc.ref));
    for (const student of students) {
        const docRef = doc(studentsCollection, student.id);
        batch.set(docRef, student);
    }

    await batch.commit();

    return { success: true, message: 'Database seeded successfully! All old data has been replaced.' };

  } catch (error: any) {
    if (error.code === 'permission-denied' || (error.message && error.message.includes('permission-denied'))) {
        return { 
          success: false, 
          message: 'Permission denied while seeding database.',
          isPermissionError: true,
          errorContext: {
            operation: 'batch-write',
            path: 'root',
            data: {
                deptCount: departments.length,
                classCount: classes.length,
                studentCount: students.length
            }
          }
        };
    }

    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}
