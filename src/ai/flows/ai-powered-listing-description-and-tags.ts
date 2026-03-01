'use server';
/**
 * @fileOverview An AI-powered listing assistant that suggests descriptive tags and initial descriptions
 * for collectibles based on an uploaded image.
 *
 * - suggestListingDetails - A function that handles the suggestion process.
 * - SuggestListingDetailsInput - The input type for the suggestListingDetails function.
 * - SuggestListingDetailsOutput - The return type for the suggestListingDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestListingDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a collectible, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestListingDetailsInput = z.infer<typeof SuggestListingDetailsInputSchema>;

const SuggestListingDetailsOutputSchema = z.object({
  description: z.string().describe('An initial descriptive text for the collectible.'),
  tags: z.array(z.string()).describe('A list of relevant descriptive tags for the collectible.'),
});
export type SuggestListingDetailsOutput = z.infer<typeof SuggestListingDetailsOutputSchema>;

export async function suggestListingDetails(input: SuggestListingDetailsInput): Promise<SuggestListingDetailsOutput> {
  return suggestListingDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestListingDetailsPrompt',
  input: {schema: SuggestListingDetailsInputSchema},
  output: {schema: SuggestListingDetailsOutputSchema},
  prompt: `You are an AI assistant specialized in describing collectible items.

Analyze the provided image of a collectible item. Based on the visual information, generate a concise yet detailed initial description and a list of relevant keywords/tags.

The description should highlight key features, condition, and potential historical or aesthetic value.

The tags should be single words or short phrases that are highly descriptive and useful for searching.

Photo: {{media url=photoDataUri}}`,
});

const suggestListingDetailsFlow = ai.defineFlow(
  {
    name: 'suggestListingDetailsFlow',
    inputSchema: SuggestListingDetailsInputSchema,
    outputSchema: SuggestListingDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
