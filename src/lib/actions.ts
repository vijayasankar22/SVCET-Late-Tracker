'use server';

import { collection, writeBatch, getDocs, query, doc, where, Timestamp, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { departments, classes, students } from '@/lib/data';

export async function seedDatabase() {
  try {
    const batch = writeBatch(db);

    const departmentsCollection = collection(db, 'departments');
    for (const dept of departments) {
      const docRef = doc(departmentsCollection, dept.id);
      batch.set(docRef, dept);
    }

    const classesCollection = collection(db, 'classes');
    for (const cls of classes) {
      const docRef = doc(classesCollection, cls.id);
      batch.set(docRef, cls);
    }

    const studentsCollection = collection(db, 'students');
    for (const student of students) {
        const docRef = doc(studentsCollection, student.id);
        batch.set(docRef, student);
    }

    await batch.commit();

    return { success: true, message: 'Database seeded successfully!' };

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
    const recordsCollection = collection(db, 'lateRecords');
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    // Query for the last 2 records from today
    const q = query(
        recordsCollection, 
        where('timestamp', '>=', todayTimestamp),
        orderBy('timestamp', 'desc'), 
        limit(2)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: true, message: 'No records found from today to delete.' };
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    return { success: true, message: `Successfully deleted ${querySnapshot.size} record(s) from today.` };

  } catch (error) {
    console.error('Error cleaning up recent records:', error);
    if (error instanceof Error) {
        return { success: false, message: `Error cleaning up records: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during cleanup.' };
  }
}

export async function cleanupRecordsBeforeDate() {
  try {
    const recordsCollection = collection(db, 'lateRecords');
    
    // Set the cutoff date to Sep 22, 2025
    const cutoffDate = new Date('2025-09-22T00:00:00');
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    // Query for records before the cutoff date
    const q = query(
        recordsCollection, 
        where('timestamp', '<', cutoffTimestamp)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: true, message: 'No records found before Sep 22, 2025 to delete.' };
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    return { success: true, message: `Successfully deleted ${querySnapshot.size} record(s) from before Sep 22, 2025.` };

  } catch (error) {
    console.error('Error cleaning up old records:', error);
    if (error instanceof Error) {
        return { success: false, message: `Error cleaning up records: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during cleanup.' };
  }
}
