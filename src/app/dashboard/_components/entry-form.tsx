
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

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
  const [studentComboboxOpen, setStudentComboboxOpen] = useState(false);

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
        form.reset();
      }
      setIsSubmitting(false);
    }
  }

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
        form.setValue("studentId", student.id);
        form.setValue("departmentId", student.departmentId);
        form.setValue("classId", student.classId, { shouldValidate: true });
        setStudentComboboxOpen(false);
    }
  };
  
  const handleDepartmentChange = (value: string) => {
    form.setValue('departmentId', value);
    form.setValue('classId', '');
    form.setValue('studentId', '');
  };
  
  const handleClassChange = (value: string) => {
    form.setValue('classId', value);
    form.setValue('studentId', '');
  };

  const studentValue = form.watch('studentId');

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mark Student Late</CardTitle>
        <CardDescription>Search for a student, their details will be filled automatically. Then click "Mark Late".</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name</FormLabel>
                    <Popover open={studentComboboxOpen} onOpenChange={setStudentComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={studentComboboxOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                          >
                            {studentValue
                              ? students.find(
                                  (student) => student.id === studentValue
                                )?.name
                              : "Search and Select Student"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search student..." />
                          <CommandEmpty>No student found.</CommandEmpty>
                          <CommandGroup>
                            {students.map((student) => (
                              <CommandItem
                                value={student.name}
                                key={student.id}
                                onSelect={() => handleStudentSelect(student.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    student.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {student.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={handleDepartmentChange} value={field.value} disabled={isSubmitting || departments.length === 0}>
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
                      disabled={isSubmitting}
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
                        <FormLabel className="font-normal">Informed</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
