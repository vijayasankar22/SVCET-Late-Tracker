'use server';

import { collection, writeBatch, getDocs, query, doc, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { departments, classes, students } from '@/lib/data';

export async function seedDatabase() {
  try {
    const batch = writeBatch(db);
    
    const departmentsCollection = collection(db, 'departments');
    const classesCollection = collection(db, 'classes');
    const studentsCollection = collection(db, 'students');

    console.log('Seeding departments...');
    departments.forEach((dept) => {
      const docRef = doc(departmentsCollection, dept.id);
      batch.set(docRef, dept);
    });

    console.log('Seeding classes...');
    classes.forEach((cls) => {
      const docRef = doc(classesCollection, cls.id);
      batch.set(docRef, cls);
    });

    console.log('Seeding students...');
    students.forEach((student) => {
      const docRef = doc(studentsCollection, student.id);
      batch.set(docRef, student);
    });

    await batch.commit();
    
    return { success: true, message: 'Database seeded successfully with the latest data!' };

  } catch (error) {
    console.error('Error seeding database:', error);
    if (error instanceof Error) {
        return { success: false, message: `Error seeding database: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred while seeding the database.' };
  }
}

export async function cleanupOldRecords() {
  try {
    const cleanupDate = new Date('2024-09-22T00:00:00');
    const cleanupTimestamp = Timestamp.fromDate(cleanupDate);

    const recordsCollection = collection(db, 'lateRecords');
    const q = query(recordsCollection, where('timestamp', '<', cleanupTimestamp));

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: true, message: 'No records found before September 22, 2024. Nothing to delete.' };
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    return { success: true, message: `${querySnapshot.size} old record(s) have been deleted successfully.` };

  } catch (error) {
    console.error('Error cleaning up old records:', error);
    if (error instanceof Error) {
        return { success: false, message: `Error cleaning up records: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during cleanup.' };
  }
}
