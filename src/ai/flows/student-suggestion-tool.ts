'use server';

/**
 * @fileOverview An AI-powered tool that suggests student names based on the selected department and class.
 *
 * - suggestStudentNames - A function that suggests student names based on department and class.
 * - SuggestStudentNamesInput - The input type for the suggestStudentNames function.
 * - SuggestStudentNamesOutput - The return type for the suggestStudentNames function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestStudentNamesInputSchema = z.object({
  department: z
    .string()
    .describe('The department of the student (e.g., CSE, ECE, MBA).'),
  className: z
    .string()
    .describe('The class name of the student (e.g., II-A, III, I).'),
});
export type SuggestStudentNamesInput = z.infer<typeof SuggestStudentNamesInputSchema>;

const SuggestStudentNamesOutputSchema = z.object({
  studentNames: z
    .array(z.string())
    .describe('An array of suggested student names based on the department and class.'),
});
export type SuggestStudentNamesOutput = z.infer<typeof SuggestStudentNamesOutputSchema>;

export async function suggestStudentNames(
  input: SuggestStudentNamesInput
): Promise<SuggestStudentNamesOutput> {
  return suggestStudentNamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStudentNamesPrompt',
  input: {schema: SuggestStudentNamesInputSchema},
  output: {schema: SuggestStudentNamesOutputSchema},
  prompt: `You are a helpful assistant that suggests student names based on the department and class provided.

  Suggest a list of student names for the following department and class:

  Department: {{{department}}}
  Class: {{{className}}}

  The student names should be relevant to the department and class.
  Return only student names, do not add any extra text to your answer.
  Return five names.
  `,
});

const suggestStudentNamesFlow = ai.defineFlow(
  {
    name: 'suggestStudentNamesFlow',
    inputSchema: SuggestStudentNamesInputSchema,
    outputSchema: SuggestStudentNamesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
