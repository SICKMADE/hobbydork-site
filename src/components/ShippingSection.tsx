import React, { Dispatch, SetStateAction } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Truck, Calculator, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingSectionProps {
  shippingType: 'Free' | 'Paid';
  setShippingType: Dispatch<SetStateAction<'Free' | 'Paid'>>;
  weight: string;
  setWeight: Dispatch<SetStateAction<string>>;
  length: string;
  setLength: Dispatch<SetStateAction<string>>;
  width: string;
  setWidth: Dispatch<SetStateAction<string>>;
  height: string;
  setHeight: Dispatch<SetStateAction<string>>;
  isCalculatingShipping: boolean;
  calculateShipping: () => void;
}

export const ShippingSection: React.FC<ShippingSectionProps> = ({
  shippingType,
  setShippingType,
  weight,
  setWeight,
  length,
  setLength,
  width,
  setWidth,
  height,
  setHeight,
  isCalculatingShipping,
  calculateShipping,
}) => (
  <section className="space-y-8">
    <div className="flex items-center gap-3">
      <div className="bg-accent/10 p-3 rounded-xl">
        <Truck className="w-6 h-6 text-accent" />
      </div>
      <div>
        <h3 className="text-xl font-black uppercase tracking-tighter">Shipping</h3>
        <p className="text-xs text-muted-foreground font-bold">Manage delivery options.</p>
      </div>
    </div>
    <RadioGroup defaultValue="Free" className="grid grid-cols-2 gap-4" onValueChange={(val) => setShippingType(val as 'Free' | 'Paid')}> 
      {['Free', 'Paid'].map(t => (
        <div key={t} className={cn("flex flex-col gap-2 p-6 rounded-xl border-2 transition-all cursor-pointer", shippingType === t ? "bg-white border-accent shadow-lg" : "bg-transparent border-zinc-200")}> 
          <RadioGroupItem value={t} id={`ship-${t}`} className="sr-only" />
          <Label htmlFor={`ship-${t}`} className="cursor-pointer flex flex-col gap-1">
            <span className="font-black uppercase tracking-widest text-xs">{t} Shipping</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
    {shippingType === 'Paid' && (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">Weight (lbs)</Label>
            <Input type="number" className="h-12 rounded-xl border-2" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">Dimensions</Label>
            <div className="flex gap-2">
              <Input placeholder="L" className="h-12 border-2" value={length} onChange={(e) => setLength(e.target.value)} />
              <Input placeholder="W" className="h-12 border-2" value={width} onChange={(e) => setWidth(e.target.value)} />
              <Input placeholder="H" className="h-12 border-2" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
          </div>
        </div>
        <Button type="button" onClick={calculateShipping} disabled={isCalculatingShipping} className="w-full bg-zinc-950 text-white font-black rounded-xl h-14">
          {isCalculatingShipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
          Calculate Shipping Rate
        </Button>
      </div>
    )}
  </section>
);
