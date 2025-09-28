'use server';

import { collection, writeBatch, getDocs, query, doc, where, Timestamp, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { departments, classes, students } from '@/lib/data';

export async function seedDatabase() {
  try {
    const batch = writeBatch(db);
    
    // START: Manual cleanup for old CSE data
    const oldCseDeptRef = doc(db, 'departments', 'cse');
    batch.delete(oldCseDeptRef);
    
    const oldCseClasses = ['cse-2-a', 'cse-2-b', 'cse-3-a', 'cse-3-b', 'cse-4-a', 'cse-4-b'];
    oldCseClasses.forEach(classId => {
      batch.delete(doc(db, 'classes', classId));
    });
    
    // To delete all students from CSE, we'd have to query them. 
    // It's safer to delete the department and classes and let the student dropdowns become empty.
    // A more robust solution for large data would be a separate cleanup script.
    // For now, this handles the department and class removal on seed.
    console.log('Scheduling deletion for old CSE department and classes.');
    // END: Manual cleanup
    
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
    
    // Second batch for querying and deleting students to avoid read/write in same batch
    const cleanupBatch = writeBatch(db);
    const studentsQuery = query(collection(db, 'students'), where('departmentId', '==', 'cse'));
    const studentsSnapshot = await getDocs(studentsQuery);
    if (!studentsSnapshot.empty) {
      console.log(`Found ${studentsSnapshot.docs.length} old CSE students to delete.`);
      studentsSnapshot.forEach(studentDoc => {
        cleanupBatch.delete(studentDoc.ref);
      });
      await cleanupBatch.commit();
      console.log('Old CSE students deleted.');
    }

    return { success: true, message: 'Database seeded successfully. Old CSE data has been removed.' };

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
    // Query for the last record by ordering by timestamp descending and limiting to 1
    const q = query(recordsCollection, orderBy('timestamp', 'desc'), limit(1));

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: true, message: 'No records found to delete.' };
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    return { success: true, message: `The last record has been deleted successfully.` };

  } catch (error) {
    console.error('Error cleaning up recent records:', error);
    if (error instanceof Error) {
        return { success: false, message: `Error cleaning up records: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred during cleanup.' };
  }
}
