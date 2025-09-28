
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { LateRecord, Department, Class, Student } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  departmentId: z.string().min(1, 'Please select a department.'),
  classId: z.string().min(1, 'Please select a class.'),
  studentId: z.string().min(1, 'Please select a student.'),
  status: z.enum(['Informed', 'Not Informed'], {
    required_error: 'You need to select a notification status.',
  }),
});

type EntryFormProps = {
  onAddRecord: (record: Omit<LateRecord, 'id' | 'timestamp'>) => Promise<boolean>;
  departments: Department[];
  classes: Class[];
  students: Student[];
};

export function EntryForm({ onAddRecord, departments, classes, students }: EntryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departmentId: '',
      classId: '',
      studentId: '',
      status: 'Not Informed',
    },
  });

  const selectedDepartmentId = form.watch('departmentId');

  const availableClasses = classes.filter((c) => c.departmentId === selectedDepartmentId);
  const availableStudents = students.filter((s) => s.classId === form.watch('classId'));

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const student = students.find((s) => s.id === values.studentId);
    const department = departments.find((d) => d.id === values.departmentId);
    const cls = classes.find((c) => c.id === values.classId);

    if (student && department && cls && user) {
      setIsSubmitting(true);
      const now = new Date();
      const newRecord = {
        studentId: student.id,
        studentName: student.name,
        registerNo: student.registerNo || '',
        gender: student.gender || 'MALE',
        departmentName: department.name,
        className: cls.name,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        markedBy: user.name,
        status: values.status,
      };
      
      const success = await onAddRecord(newRecord);

      if (success) {
        toast({
          title: 'Success!',
          description: `${student.name} has been marked as late.`,
        });

        if (values.status === 'Not Informed' && student.parentPhoneNumber) {
          const message = `Dear Parent, your ward ${student.name} (${student.registerNo}) has been marked late to college today, ${now.toLocaleDateString()}. Thank you, SVCET.`;
          const whatsappUrl = `https://wa.me/${student.parentPhoneNumber}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }

        form.reset();
      }
      setIsSubmitting(false);
    }
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mark Student Late</CardTitle>
        <CardDescription>Select a department and class to see the list of students.</CardDescription>
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
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('classId', '');
                      form.setValue('studentId', '');
                    }} value={field.value} disabled={isSubmitting}>
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
                     <Select onValueChange={(value) => {
                       field.onChange(value)
                       form.setValue('studentId', '');
                     }} value={field.value} disabled={!selectedDepartmentId || isSubmitting}>
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
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch('classId') || isSubmitting}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>{student.name} - {student.registerNo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Status (Parent/Guardian)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      disabled={isSubmitting}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Not Informed" />
                        </FormControl>
                        <FormLabel className="font-normal">Not Informed (Clicking 'Mark Late' will open WhatsApp)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Informed" />
                        </FormControl>
                        <FormLabel className="font-normal">Already Informed</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" className="bg-accent hover:bg-accent/90 w-full md:w-auto" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting ? 'Submitting...' : 'Mark Late'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
