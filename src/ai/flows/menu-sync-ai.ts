'use server';

/**
 * @fileOverview A menu synchronization AI agent.
 *
 * - menuSync - A function that handles the menu synchronization process.
 * - MenuSyncInput - The input type for the menuSync function.
 * - MenuSyncOutput - The return type for the menuSync function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MenuSyncInputSchema = z.object({
  excelDataUri: z
    .string()
    .describe(
      "An Excel file of the menu, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type MenuSyncInput = z.infer<typeof MenuSyncInputSchema>;

const MenuSyncOutputSchema = z.object({
  menuItems: z
    .string()
    .describe('The parsed menu items in JSON format.'),
});
export type MenuSyncOutput = z.infer<typeof MenuSyncOutputSchema>;

export async function menuSync(input: MenuSyncInput): Promise<MenuSyncOutput> {
  return menuSyncFlow(input);
}

const prompt = ai.definePrompt({
  name: 'menuSyncPrompt',
  input: {schema: MenuSyncInputSchema},
  output: {schema: MenuSyncOutputSchema},
  prompt: `You are an AI menu parser. You will parse the menu from the Excel file and return the menu items in JSON format.

Excel File: {{media url=excelDataUri}}`,
});

const menuSyncFlow = ai.defineFlow(
  {
    name: 'menuSyncFlow',
    inputSchema: MenuSyncInputSchema,
    outputSchema: MenuSyncOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
