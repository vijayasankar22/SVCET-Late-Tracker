'use server';

import { collection, writeBatch, getDocs, query, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { departments, classes, students } from '@/lib/data';

export async function seedDatabase() {
  try {
    const batch = writeBatch(db);
    
    const departmentsCollection = collection(db, 'departments');
    const classesCollection = collection(db, 'classes');
    const studentsCollection = collection(db, 'students');

    const deptCheck = await getDocs(query(departmentsCollection));
    if (deptCheck.empty) {
      console.log('Seeding departments...');
      departments.forEach((dept) => {
        const docRef = doc(departmentsCollection, dept.id);
        batch.set(docRef, dept);
      });
    } else {
      console.log('Departments collection already has data. Skipping.');
    }

    const classCheck = await getDocs(query(classesCollection));
    if (classCheck.empty) {
      console.log('Seeding classes...');
      classes.forEach((cls) => {
        const docRef = doc(classesCollection, cls.id);
        batch.set(docRef, cls);
      });
    } else {
      console.log('Classes collection already has data. Skipping.');
    }

    const studentCheck = await getDocs(query(studentsCollection));
    if (studentCheck.empty) {
      console.log('Seeding students...');
      students.forEach((student) => {
        const docRef = doc(studentsCollection, student.id);
        batch.set(docRef, student);
      });
    } else {
      console.log('Students collection already has data. Skipping.');
    }

    await batch.commit();
    
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
