'use server';

import { collection, writeBatch, getDocs, query, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { departments, classes, students } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export async function seedDatabase() {
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

  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
        const permissionError = new FirestorePermissionError({
            path: '/ (batch write)',
            operation: 'write',
            requestResourceData: {
                departments: departments.length,
                classes: classes.length,
                students: students.length,
            },
        });
        errorEmitter.emit('permission-error', permissionError);

        // This message will be caught by the client and can be displayed,
        // but the detailed error is in the dev overlay.
        return { success: false, message: 'Permission denied while seeding database. Check developer console for details.'};
    }

    console.error('Error seeding database:', error);
    if (error instanceof Error) {
        return { success: false, message: `Error seeding database: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred while seeding the database.' };
  }
}
