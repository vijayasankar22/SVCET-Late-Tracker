"use server";

import { suggestStudentNames } from "@/ai/flows/student-suggestion-tool";
import type { SuggestStudentNamesInput } from "@/ai/flows/student-suggestion-tool";

export async function suggestStudentsAction(input: SuggestStudentNamesInput) {
  try {
    const result = await suggestStudentNames(input);
    return { success: true, data: result.studentNames };
  } catch (error) {
    console.error("AI suggestion failed:", error);
    return { success: false, error: "Failed to get suggestions from AI." };
  }
}
