import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CATEGORIES } from '@/lib/mock-data';

interface ItemDetailsSectionProps {
  title: string;
  setTitle: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  condition: 'New' | 'Like New' | 'Used';
  setCondition: (v: 'New' | 'Like New' | 'Used') => void;
  type: string;
  setType: (v: string) => void;
}

export const ItemDetailsSection: React.FC<ItemDetailsSectionProps> = ({
  title,
  setTitle,
  category,
  setCategory,
  condition,
  setCondition,
  type,
  setType,
}) => (
  <section className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest">Listing Title</Label>
      <Input id="title" placeholder="e.g. 1968 Omega Speedmaster" className="h-14 rounded-xl border-2 font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest">Category</Label>
        <Select onValueChange={setCategory} value={category} required>
          <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="Select Category" /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest">Condition</Label>
        <Select onValueChange={(val) => setCondition(val as 'New' | 'Like New' | 'Used')} value={condition}>
          <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Like New">Like New</SelectItem>
            <SelectItem value="Used">Used</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest">Pricing Model</Label>
        <RadioGroup value={type} className="flex gap-2" onValueChange={setType}>
          <RadioGroupItem value="bin" id="bin">
            <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Label htmlFor="bin" className="cursor-pointer font-bold">Buy It Now</Label>
            </div>
          </RadioGroupItem>
          <RadioGroupItem value="auction" id="auction">
            <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Label htmlFor="auction" className="cursor-pointer font-bold">Auction</Label>
            </div>
          </RadioGroupItem>
        </RadioGroup>
      </div>
    </div>
  </section>
);