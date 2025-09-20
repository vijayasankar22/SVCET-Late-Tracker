'use server';

import { collection, writeBatch, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { departments, classes, students } from '@/lib/data';

export async function seedDatabase() {
  try {
    const batch = writeBatch(db);
    
    // Check if collections are already populated to avoid duplicates
    const deptCheck = await getDocs(query(collection(db, 'departments')));
    if (deptCheck.empty) {
      console.log('Seeding departments...');
      departments.forEach((dept) => {
        const docRef = collection(db, 'departments');
        batch.set(docRef.doc(dept.id), dept);
      });
    } else {
      console.log('Departments collection already has data. Skipping.');
    }

    const classCheck = await getDocs(query(collection(db, 'classes')));
    if (classCheck.empty) {
      console.log('Seeding classes...');
      classes.forEach((cls) => {
        const docRef = collection(db, 'classes');
        batch.set(docRef.doc(cls.id), cls);
      });
    } else {
      console.log('Classes collection already has data. Skipping.');
    }

    const studentCheck = await getDocs(query(collection(db, 'students')));
    if (studentCheck.empty) {
      console.log('Seeding students...');
      students.forEach((student) => {
        const docRef = collection(db, 'students');
        batch.set(docRef.doc(student.id), student);
      });
    } else {
      console.log('Students collection already has data. Skipping.');
    }

    await batch.commit();
    
    // Check if anything was actually seeded
    if (deptCheck.empty || classCheck.empty || studentCheck.empty) {
        return { success: true, message: 'Database seeded successfully!' };
    } else {
        return { success: true, message: 'Database already contains data. No new data was added.' };
    }

  } catch (error) {
    console.error('Error seeding database:', error);
    if (error instanceof Error) {
        return { success: false, message: `Error seeding database: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred while seeding the database.' };
  }
}
