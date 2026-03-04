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
import { analyzeDefects } from '@/ai/vision/analyzeDefects';
import { GRADING_OPTIONS } from '@/lib/mock-data';

const SuggestListingDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a collectible, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestListingDetailsInput = z.infer<typeof SuggestListingDetailsInputSchema>;


const SuggestListingDetailsOutputSchema = z.object({
  type: z.string().describe('The classified type of collectible (e.g., comic book, trading card, sealed video game, coin, toy, etc).'),
  description: z.string().describe('An initial descriptive text for the collectible.'),
  tags: z.array(z.string()).describe('A list of relevant descriptive tags for the collectible.'),
  condition: z.object({
    surface: z.string().describe('Description of the surface condition.'),
    edges: z.string().describe('Description of the edges/corners.'),
    centering: z.string().describe('Description of centering or alignment.'),
    overallCondition: z.string().describe('Overall condition summary.'),
    confidence: z.number().min(0).max(1).describe('Confidence score (0-1) for the condition assessment.'),
    gradingStandardReference: z.string().describe('Reference to the grading standard used (e.g., PSA, CGC, PCGS, VGA, WATA, etc.).'),
    inconsistencies: z.string().optional().describe('Any detected inconsistencies with grading standards.'),
  }),
});
export type SuggestListingDetailsOutput = z.infer<typeof SuggestListingDetailsOutputSchema>;

export async function suggestListingDetails(input: SuggestListingDetailsInput): Promise<SuggestListingDetailsOutput> {
  return suggestListingDetailsFlow(input);
}


function buildPrompt(defectAnalysis: any) {
  if (defectAnalysis.itemType === 'comic') {
    return `You are an AI assistant specialized in grading and describing comic books for online listings.

  First, classify the collectible in the image as a comic book and reference CGC grading standards.


  IMPORTANT: Spine damage (ticks, splits, roll, tears) is the most critical factor in comic book grading. Always prioritize spine defects in your assessment and output. If spine damage is present, describe it in detail and reflect its impact in the overall condition and confidence score.


  IMPORTANT: If the cover is ripped, torn, or incomplete, this is a major defect and should bring the condition score down significantly. Always note any cover rips or tears and explain their impact on the grade.


  IMPORTANT: Use the official CGC grading scale (0.5 to 10) when summarizing the comic's condition. Reference the CGC scale in your output and condition summary, and provide an estimated grade based on this scale.

  IMPORTANT: Always include both the CGC numeric grade and the corresponding descriptive term (e.g., Gem Mint, Mint, Near Mint, Very Fine, Fine, Very Good, Good, Fair, Poor) in the condition summary for comics.

  You have access to the following image defect analysis:
  Surface Defects: ${defectAnalysis.surfaceDefects}
  Edge Defects: ${defectAnalysis.edgeDefects}
  Spine Defects: ${defectAnalysis.spineDefects}
  Cover Gloss: ${defectAnalysis.coverGloss}
  Yellowing: ${defectAnalysis.yellowing}

  Then, output a JSON object with these fields:
  - type: The classified type of collectible (should be comic book).
  - description: A concise, detailed description of the comic.
  - tags: A list of relevant keywords/tags.
  - condition: An object with:
    - surface: Describe the cover and page surface condition (creases, gloss, etc).
    - edges: Describe the edges/corners (blunting, chips, etc).
    - spine: Describe spine defects (ticks, splits, roll, etc).
    - coverGloss: Describe gloss quality.
    - yellowing: Describe any yellowing of pages or cover.
    - overallCondition: A summary of the overall condition (e.g., "Near Mint", "Very Fine").
    - confidence: A number from 0 to 1 indicating your confidence in the assessment.
    - gradingStandardReference: CGC.
    - inconsistencies: Any detected inconsistencies with CGC grading standards.

  Do NOT include centering in your output for comics.
  Reference CGC grading standards. If the image is unclear, lower your confidence score and explain why.

  Photo: {{media url=photoDataUri}}`;
  }
  // Sports Cards and TCG
  if (defectAnalysis.itemType === 'card' || defectAnalysis.itemType === 'tcg' || defectAnalysis.itemType === 'sports card' || defectAnalysis.type?.toLowerCase().includes('card')) {
    return `You are an AI assistant specialized in grading and describing sports cards and trading card games (TCG) for online listings.

First, classify the collectible in the image as a sports card or TCG card and reference PSA/BGS/SGC grading standards.

IMPORTANT: Corners, bends, white paint chip or loss on card corners, edges, and surface are critical. Always describe these in detail. Centering is also important—note any off-centering. For vintage cards, consider that lower grades are common due to age; take this into account when summarizing condition. For chrome cards, it may be difficult to see surface scratches—lower your confidence score and note this limitation if applicable.

You have access to the following image defect analysis:
Surface Defects: ${defectAnalysis.surfaceDefects}
Edge Defects: ${defectAnalysis.edgeDefects}
Centering Issues: ${defectAnalysis.centeringIssues}

Then, output a JSON object with these fields:
- type: The classified type of collectible (should be sports card or TCG).
- description: A concise, detailed description of the card.
- tags: A list of relevant keywords/tags.
- condition: An object with:
    - surface: Describe the surface condition (scratches, gloss, print lines, etc).
    - edges: Describe the edges (wear, paint loss, chips, etc).
    - corners: Describe the corners (bends, paint loss, chips, etc).
    - centering: Describe centering/alignment.
    - overallCondition: A summary of the overall condition (e.g., "Near Mint", "Excellent").
    - confidence: A number from 0 to 1 indicating your confidence in the assessment.
    - gradingStandardReference: PSA, BGS, or SGC.
    - inconsistencies: Any detected inconsistencies with grading standards.

Reference official grading standards for the item type. If the image is unclear or surface scratches are hard to detect (e.g., chrome cards), lower your confidence score and explain why.

Photo: {{media url=photoDataUri}}`;
  }
  // Default for other types
  return `You are an AI assistant specialized in grading and describing collectible items for online listings.

First, classify the collectible in the image as one of: comic book, trading card, sealed video game, coin, toy, stamp, watch, or other. Be as specific as possible (e.g., "sealed video game" vs "loose cartridge").

You have access to the following image defect analysis:
Surface Defects: ${defectAnalysis.surfaceDefects}
Edge Defects: ${defectAnalysis.edgeDefects}
Centering Issues: ${defectAnalysis.centeringIssues}

Then, output a JSON object with these fields:
- type: The classified type of collectible (e.g., comic book, trading card, sealed video game, coin, toy, etc).
- description: A concise, detailed description of the item.
- tags: A list of relevant keywords/tags.
- condition: An object with:
    - surface: Describe the surface condition (scratches, gloss, etc).
    - edges: Describe the edges/corners (wear, dings, etc).
    - centering: Describe centering/alignment (if relevant).
    - overallCondition: A summary of the overall condition (e.g., "Near Mint", "Excellent").
    - confidence: A number from 0 to 1 indicating your confidence in the assessment.
    - gradingStandardReference: The grading standard used (e.g., PSA, CGC, PCGS, VGA, WATA, etc). Choose the most relevant for the item type.
    - inconsistencies: Any detected inconsistencies with the referenced grading standard.

Reference official grading standards for the item type. If the image is unclear, lower your confidence score and explain why.

If the provided images are insufficient for accurate grading, suggest to the user which additional photo angles or item positions would help (e.g., close-ups of corners, spine, edges, surface, or specific lighting). Clearly communicate what is needed for a more reliable assessment.

Photo: {{media url=photoDataUri}}`;
}

const suggestListingDetailsFlow = ai.defineFlow(
  {
    name: 'suggestListingDetailsFlow',
    inputSchema: SuggestListingDetailsInputSchema,
    outputSchema: SuggestListingDetailsOutputSchema,
  },
  async input => {
    // Run image defect analysis first
    const defectAnalysis = await analyzeDefects(input.photoDataUri);
    // Build prompt with defect analysis
    const promptText = buildPrompt(defectAnalysis);
    const promptInstance = ai.definePrompt({
      name: 'suggestListingDetailsPrompt',
      input: { schema: SuggestListingDetailsInputSchema },
      output: { schema: SuggestListingDetailsOutputSchema },
      prompt: promptText,
    });
    const { output } = await promptInstance(input);

    // Cross-reference with grading standards
    let inconsistencies = output.condition.inconsistencies || '';
    const category = output.type?.toLowerCase();
    let matched = false;
    for (const key in GRADING_OPTIONS) {
      if (category && key.toLowerCase().includes(category)) {
        const opts = GRADING_OPTIONS[key];
        if (opts) {
          // Check company
          if (output.condition.gradingStandardReference && !opts.companies.some(c => output.condition.gradingStandardReference.includes(c))) {
            inconsistencies += ` Grading company '${output.condition.gradingStandardReference}' is not standard for this category.`;
          }
          // Check grade
          if (output.condition.overallCondition && !opts.grades.some(g => output.condition.overallCondition.includes(g))) {
            inconsistencies += ` Grade '${output.condition.overallCondition}' is not standard for this category.`;
          }
          matched = true;
        }
      }
    }
    if (!matched) {
      inconsistencies += ' Could not cross-reference grading standards for this category.';
    }
    output.condition.inconsistencies = inconsistencies.trim();
    return output!;
  }
);
