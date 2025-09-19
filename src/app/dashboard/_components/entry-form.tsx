"use client";

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { departments, classes, students } from '@/lib/data';
import type { LateRecord } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

const formSchema = z.object({
  departmentId: z.string().min(1, 'Please select a department.'),
  classId: z.string().min(1, 'Please select a class.'),
  studentId: z.string().min(1, 'Please select a student.'),
});

type EntryFormProps = {
  onAddRecord: (record: Omit<LateRecord, 'id'>) => Promise<boolean>;
};

export function EntryForm({ onAddRecord }: EntryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departmentId: '',
      classId: '',
      studentId: '',
    },
  });

  const selectedDepartmentId = form.watch('departmentId');
  const selectedClassId = form.watch('classId');

  const availableClasses = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return classes.filter((c) => c.departmentId === selectedDepartmentId);
  }, [selectedDepartmentId]);

  const availableStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.classId === selectedClassId);
  }, [selectedClassId]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const student = students.find((s) => s.id === values.studentId);
    const department = departments.find((d) => d.id === values.departmentId);
    const cls = classes.find((c) => c.id === values.classId);

    if (student && department && cls && user) {
      setIsSubmitting(true);
      const now = new Date();
      const newRecord = {
        studentName: student.name,
        departmentName: department.name,
        className: cls.name,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        markedBy: user.name,
      };
      
      const success = await onAddRecord(newRecord);

      if (success) {
        toast({
          title: 'Success!',
          description: `${student.name} has been marked as late.`,
        });
        form.reset();
      }
      setIsSubmitting(false);
    }
  }
  
  // Reset class and student when department changes
  const handleDepartmentChange = (value: string) => {
    form.setValue('departmentId', value);
    form.setValue('classId', '');
    form.setValue('studentId', '');
  };
  
  // Reset student when class changes
  const handleClassChange = (value: string) => {
    form.setValue('classId', value);
    form.setValue('studentId', '');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mark Student Late</CardTitle>
        <CardDescription>Select a student and click "Mark Late" to record their tardiness.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={handleDepartmentChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={handleClassChange} value={field.value} disabled={!selectedDepartmentId || isSubmitting}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Student Name</FormLabel>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClassId || isSubmitting}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-accent hover:bg-accent/90 w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Mark Late'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
