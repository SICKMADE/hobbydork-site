'use server';
/**
 * @fileOverview AI flow for estimating the market value of a collectible.
 * Now uses a tool to simulate fetching real-world pricing data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const searchEbaySoldPrices = ai.defineTool(
  {
    name: 'searchEbaySoldPrices',
    description: 'Searches for recent sold prices on eBay for a specific collectible item.',
    inputSchema: z.object({
      query: z.string().describe('The name and specific details of the item to search for.'),
    }),
    outputSchema: z.object({
      recentSales: z.array(z.object({
        price: z.number(),
        date: z.string(),
        condition: z.string(),
      })),
      averagePrice: z.number(),
    }),
  },
  async (input) => {
    // In a real app, this would call an eBay API. 
    // For this prototype, we simulate a realistic response.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Simulating eBay search for: ${input.query}`);
    }
    
    // Logic to generate slightly randomized but realistic mock data based on query length/complexity
    const basePrice = Math.floor(Math.random() * 500) + 100;
    
    return {
      recentSales: [
        { price: basePrice + 50, date: '2024-03-15', condition: 'Near Mint' },
        { price: basePrice - 20, date: '2024-03-10', condition: 'Excellent' },
        { price: basePrice, date: '2024-03-01', condition: 'Mint' },
      ],
      averagePrice: basePrice + 10,
    };
  }
);

const EstimatePriceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a collectible, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  itemTitle: z.string().optional().describe('Optional title provided by the user.'),
});
export type EstimatePriceInput = z.infer<typeof EstimatePriceInputSchema>;

const EstimatePriceOutputSchema = z.object({
  estimatedValueRange: z.object({
    low: z.number().describe('Low end of estimated market value.'),
    high: z.number().describe('High end of estimated market value.'),
    currency: z.string().default('USD'),
  }),
  conditionNotes: z.string().describe('Notes on the visual condition observed.'),
  rarityScore: z.number().min(1).max(10).describe('Rarity score from 1 to 10.'),
  marketAnalysis: z.string().describe('A brief explanation of why this value was estimated, mentioning any found market data.'),
});
export type EstimatePriceOutput = z.infer<typeof EstimatePriceOutputSchema>;

export async function estimatePrice(input: EstimatePriceInput): Promise<EstimatePriceOutput> {
  return estimatePriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimatePricePrompt',
  tools: [searchEbaySoldPrices],
  input: {schema: EstimatePriceInputSchema},
  output: {schema: EstimatePriceOutputSchema},
  prompt: `You are an expert appraiser for high-end collectibles.

1. Analyze the provided photo to identify the item.
2. If you identify the item, use the searchEbaySoldPrices tool to get actual recent market data.
3. Combine the visual condition of the item in the photo with the tool's data to provide a final appraisal.

Item Title (if provided): {{{itemTitle}}}
Photo: {{media url=photoDataUri}}

Provide a realistic price range, condition assessment, and rarity score.`,
});

const estimatePriceFlow = ai.defineFlow(
  {
    name: 'estimatePriceFlow',
    inputSchema: EstimatePriceInputSchema,
    outputSchema: EstimatePriceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
