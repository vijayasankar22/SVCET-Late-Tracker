import type { Department, Class, Student, Staff } from './types';

export const departments: Department[] = [
  { id: 'cse', name: 'CSE' },
  { id: 'ece', name: 'ECE' },
  { id: 'bme', name: 'BME' },
  { id: 'eee', name: 'EEE' },
  { id: 'mech', name: 'MECH' },
  { id: 'mba', name: 'MBA' },
];

export const classes: Class[] = [
  // CSE
  { id: 'cse-2a', departmentId: 'cse', name: 'II-A' },
  { id: 'cse-2b', departmentId: 'cse', name: 'II-B' },
  { id: 'cse-3a', departmentId: 'cse', name: 'III-A' },
  { id: 'cse-3b', departmentId: 'cse', name: 'III-B' },
  { id: 'cse-4a', departmentId: 'cse', name: 'IV-A' },
  { id: 'cse-4b', departmentId: 'cse', name: 'IV-B' },
  // ECE
  { id: 'ece-2', departmentId: 'ece', name: 'II' },
  { id: 'ece-3', departmentId: 'ece', name: 'III' },
  { id: 'ece-4', departmentId: 'ece', name: 'IV' },
  // BME
  { id: 'bme-2', departmentId: 'bme', name: 'II' },
  { id: 'bme-3', departmentId: 'bme', name: 'III' },
  { id: 'bme-4', departmentId: 'bme', name: 'IV' },
  // EEE
  { id: 'eee-2', departmentId: 'eee', name: 'II' },
  { id: 'eee-3', departmentId: 'eee', name: 'III' },
  { id: 'eee-4', departmentId: 'eee', name: 'IV' },
  // MECH
  { id: 'mech-2', departmentId: 'mech', name: 'II' },
  { id: 'mech-3', departmentId: 'mech', name: 'III' },
  { id: 'mech-4', departmentId: 'mech', name: 'IV' },
  // MBA
  { id: 'mba-1', departmentId: 'mba', name: 'I' },
  { id: 'mba-2', departmentId: 'mba', name: 'II' },
];

export const students: Student[] = [
  // CSE II-A
  { id: 's1', name: 'Aarav Sharma', departmentId: 'cse', classId: 'cse-2a' },
  { id: 's2', name: 'Vivaan Gupta', departmentId: 'cse', classId: 'cse-2a' },
  { id: 's3', name: 'Aditya Singh', departmentId: 'cse', classId: 'cse-2a' },
  // CSE III-A
  { id: 's4', name: 'Vihaan Kumar', departmentId: 'cse', classId: 'cse-3a' },
  { id: 's5', name: 'Arjun Patel', departmentId: 'cse', classId: 'cse-3a' },
  // ECE II
  { id: 's6', name: 'Diya Reddy', departmentId: 'ece', classId: 'ece-2' },
  { id: 's7', name: 'Saanvi Rao', departmentId: 'ece', classId: 'ece-2' },
  // BME II
  { id: 's8', name: 'Aanya Joshi', departmentId: 'bme', classId: 'bme-2' },
  { id: 's9', name: 'Myra Iyer', departmentId: 'bme', classId: 'bme-2' },
  // EEE II
  { id: 's10', name: 'Ishaan Verma', departmentId: 'eee', classId: 'eee-2' },
  { id: 's11', name: 'Kabir Mehta', departmentId: 'eee', classId: 'eee-2' },
  // MECH II
  { id: 's12', name: 'Anika Nair', departmentId: 'mech', classId: 'mech-2' },
  { id: 's13', name: 'Zara Khan', departmentId: 'mech', classId: 'mech-2' },
  // MBA I
  { id: 's14', name: 'Advik Shah', departmentId: 'mba', classId: 'mba-1' },
  { id: 's15', name: 'Ayaan Malhotra', departmentId: 'mba', classId: 'mba-1' },
];

export const mockStaff: Staff = {
  id: 'staff1',
  name: 'Admin Staff',
  email: 'admin@tardymark.com',
};
