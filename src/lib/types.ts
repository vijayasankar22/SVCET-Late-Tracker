export interface Department {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  departmentId: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  departmentId: string;
  classId: string;
  registerNo: string;
  gender: 'MALE' | 'FEMALE';
  parentPhoneNumber?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
}

export interface LateRecord {
  id: string;
  studentId: string;
  studentName: string;
  registerNo: string;
  gender: 'MALE' | 'FEMALE';
  departmentName: string;
  className: string;
  date: string;
  time: string;
  markedBy: string;
  status: 'Informed' | 'Not Informed' | 'Letter Given';
  timestamp: any;
}
