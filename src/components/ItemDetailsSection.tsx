import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GRADING_OPTIONS, CATEGORIES } from '@/lib/mock-data';

interface ItemDetailsSectionProps {
  title: string;
  setTitle: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  condition: 'New' | 'Like New' | 'Used';
  setCondition: (v: 'New' | 'Like New' | 'Used') => void;
  isGraded: boolean;
  setIsGraded: (v: boolean) => void;
  gradingCompany: string;
  setGradingCompany: (v: string) => void;
  gradingGrade: string;
  setGradingGrade: (v: string) => void;
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
  isGraded,
  setIsGraded,
  gradingCompany,
  setGradingCompany,
  gradingGrade,
  setGradingGrade,
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
    {/* Conditional Grading Section - Show if category has grading options */}
    {GRADING_OPTIONS[category as keyof typeof GRADING_OPTIONS] && (
      <div className="bg-accent/5 p-6 rounded-xl border-2 border-accent/20 space-y-4">
        <h3 className="font-black uppercase tracking-widest text-sm">Grading Information (Optional)</h3>
        <div className="flex items-center gap-4">
          <Label htmlFor="is-graded" className="flex items-center gap-2 cursor-pointer">
            <input
              id="is-graded"
              type="checkbox"
              aria-label="Item is professionally graded"
              title="Item is professionally graded"
              checked={isGraded}
              onChange={(e) => {
                setIsGraded(e.target.checked);
                if (!e.target.checked) {
                  setGradingCompany('');
                  setGradingGrade('');
                }
              }}
              className="w-4 h-4 rounded border-2 cursor-pointer"
            />
            <span className="font-bold uppercase text-[10px] tracking-widest">Item is professionally graded</span>
          </Label>
        </div>
        {isGraded && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Grading Company</Label>
              <Select value={gradingCompany} onValueChange={setGradingCompany}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {GRADING_OPTIONS[category as keyof typeof GRADING_OPTIONS]?.companies.map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Grade</Label>
              <Select value={gradingGrade} onValueChange={setGradingGrade}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADING_OPTIONS[category as keyof typeof GRADING_OPTIONS]?.grades.map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest">Pricing Model</Label>
        <RadioGroup defaultValue="bin" className="flex gap-2" onValueChange={setType}>
          <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer hover:bg-secondary/50 transition-colors"><RadioGroupItem value="bin" id="bin" /><Label htmlFor="bin" className="cursor-pointer font-bold">Buy It Now</Label></div>
          <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer hover:bg-secondary/50 transition-colors"><RadioGroupItem value="auction" id="auction" /><Label htmlFor="auction" className="cursor-pointer font-bold">Auction</Label></div>
        </RadioGroup>
      </div>
    </div>
  </section>
);
