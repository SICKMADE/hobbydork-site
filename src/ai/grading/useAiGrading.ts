import { useState } from 'react';
import { suggestListingDetails } from '@/ai/flows/ai-powered-listing-description-and-tags';
import { useToast } from '@/hooks/use-toast';

export function useAiGrading() {
  const { toast } = useToast();
  const [aiType, setAiType] = useState<string | null>(null);
  const [aiCondition, setAiCondition] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAiAssistant = async (photo: string, isGraded: boolean, setDescription: (desc: string) => void, setTags: (tags: string[]) => void) => {
    if (!photo) return;
    if (isGraded) {
      toast({ title: 'AI grading skipped for encapsulated/graded items.' });
      setAiType(null);
      setAiCondition(null);
      return;
    }
    setLoading(true);
    try {
      const result = await suggestListingDetails({ photoDataUri: photo });
      setDescription(result.description);
      setTags(result.tags);
      setAiType(result.type);
      setAiCondition(result.condition);
      toast({ title: 'Listing suggestions applied.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Suggestions failed.' });
    } finally {
      setLoading(false);
    }
  };

  return {
    aiType,
    aiCondition,
    loading,
    runAiAssistant,
    setAiType,
    setAiCondition,
  };
}
