
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { LateRecord, Department, Class, Student } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  departmentId: z.string().min(1, 'Please select a department.'),
  classId: z.string().min(1, 'Please select a class.'),
  studentId: z.string().min(1, 'Please select a student.'),
  status: z.enum(['Informed', 'Not Informed', 'Letter Given'], {
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

  const isViewer = user?.role === 'viewer';

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
  const selectedClassId = form.watch('classId');

  const availableClasses = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return classes.filter(c => c.departmentId === selectedDepartmentId);
  }, [selectedDepartmentId, classes]);

  const availableStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter(s => s.classId === selectedClassId);
  }, [selectedClassId, students]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isViewer) {
        toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to perform this action." });
        return;
    }
    
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

        if (student.parentPhoneNumber) {
          const message = `Dear Parent/Guardian, this is to inform you that your ward, ${student.name}, has been marked late today. Thank you.`;
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
        <CardDescription>Select department and class to find a student.</CardDescription>
      </CardHeader>
      <CardContent>
        {isViewer && (
            <Alert variant="default" className="mb-6 bg-secondary/50">
              <Info className="h-4 w-4" />
              <AlertTitle>Read-only Access</AlertTitle>
              <AlertDescription>
                You are logged in as a viewer. You can see all records, but you cannot mark students late.
              </AlertDescription>
            </Alert>
        )}
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
                      form.resetField("classId");
                      form.resetField("studentId");
                    }} value={field.value} disabled={isSubmitting || isViewer}>
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
                       field.onChange(value);
                       form.resetField("studentId");
                     }} value={field.value} disabled={!selectedDepartmentId || isSubmitting || isViewer}>
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
                    <FormLabel>Student Name</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClassId || isSubmitting || isViewer}>
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
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      disabled={isSubmitting || isViewer}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Not Informed" />
                        </FormControl>
                        <FormLabel className="font-normal">Not Informed</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Informed" />
                        </FormControl>
                        <FormLabel className="font-normal">Already Informed</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Letter Given" />
                        </FormControl>
                        <FormLabel className="font-normal">Letter Given</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" className="bg-accent hover:bg-accent/90 w-full md:w-auto" disabled={isSubmitting || !form.formState.isValid || isViewer}>
                {isSubmitting ? 'Submitting...' : 'Mark Late'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
