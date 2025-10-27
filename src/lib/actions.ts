'use server';

import { collection, writeBatch, getDocs, query, doc, where, Timestamp, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { departments, classes, students } from '@/lib/data';

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
    console.error('Error seeding database:', error);
    if (error instanceof Error) {
        return { success: false, message: `Error seeding database: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred while seeding the database.' };
  }
}
