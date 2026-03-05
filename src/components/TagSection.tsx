import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface TagSectionProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  newTag: string;
  setNewTag: (tag: string) => void;
}

export const TagSection: React.FC<TagSectionProps> = ({ tags, setTags, newTag, setNewTag }) => (
  <div>
    <Label className="text-xs font-black uppercase tracking-widest">Tags (Separate with Enter)</Label>
    <div className="flex flex-wrap gap-2 mb-3">
      {tags.map((tag, idx) => (
        <div key={idx} className="bg-accent/20 text-accent font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
          {tag}
          <button type="button" aria-label={`Remove tag ${tag}`} title={`Remove tag ${tag}`} onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
    <div className="flex gap-2">
      <Input 
        type="text" 
        placeholder="Add a tag..." 
        className="h-12 rounded-xl border-2" 
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (newTag.trim() && !tags.includes(newTag.trim())) {
              setTags([...tags, newTag.trim()]);
              setNewTag('');
            }
          }
        }}
      />
      <Button 
        type="button"
        onClick={() => {
          if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
          }
        }}
        className="h-12 px-4 rounded-xl font-bold uppercase text-[10px]"
      >
        Add
      </Button>
    </div>
  </div>
);
