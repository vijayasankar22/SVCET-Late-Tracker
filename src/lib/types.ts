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
}

export interface Staff {
  id: string;
  name: string;
  email: string;
}

export interface LateRecord {
  id: string;
  studentName: string;
  departmentName: string;
  className: string;
  date: string;
  time: string;
  markedBy: string;
  timestamp: any;
}
