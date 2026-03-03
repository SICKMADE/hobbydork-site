'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES, GRADING_OPTIONS } from '@/lib/mock-data';
import { cn, filterProfanity } from '@/lib/utils';
import Image from 'next/image';
import { ArrowLeft, Loader2, X, Truck, Calculator } from 'lucide-react';
import Link from 'next/link';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'New' | 'Like New' | 'Used'>('New');
  const [visibility, setVisibility] = useState<'Visible' | 'Invisible'>('Visible');
  const [type, setType] = useState('bin');
  const [photo, setPhoto] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const [shippingType, setShippingType] = useState<'Free' | 'Paid'>('Free');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [quantity, setQuantity] = useState('1');

  // Grading fields (category-specific)
  const [isGraded, setIsGraded] = useState(false);
  const [gradingCompany, setGradingCompany] = useState('');
  const [gradingGrade, setGradingGrade] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const listingRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'listings', id);
  }, [db, id]);

  const { data: listing } = useDoc(listingRef);

  useEffect(() => {
    if (!listing || !user) return;

    // Check if user is the seller
    if (listing.sellerId !== user.uid) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'You can only edit your own listings.' });
      router.push(`/listings/${id}`);
      return;
    }

    // Populate form with existing data
    setTitle(listing.title || '');
    setDescription(listing.description || '');
    setPrice(String(listing.price || ''));
    setCategory(listing.category || '');
    setCondition(listing.condition || 'New');
    setVisibility(listing.visibility || 'Visible');
    setType(listing.type === 'Buy It Now' ? 'bin' : 'auction');
    setPhoto(listing.imageUrl || '');
    setTags(listing.tags || []);
    setShippingType(listing.shippingType || 'Free');
    setWeight(String(listing.weight || ''));
    setLength(String(listing.length || ''));
    setWidth(String(listing.width || ''));
    setHeight(String(listing.height || ''));
    setCalculatedShippingCost(listing.shippingCost || null);
    setIsGraded(listing.isGraded || false);
    setGradingCompany(listing.gradingCompany || '');
    setGradingGrade(String(listing.gradingGrade || ''));
    setQuantity(String(listing.quantity || '1'));
    setIsLoading(false);
  }, [listing, user, id, router, toast]);

  const uploadPhotoToStorage = async (photoDataUri: string): Promise<string> => {
    const storage = getStorage();
    const fileName = `listings/${user!.uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, fileName);
    const response = await fetch(photoDataUri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const compressImageForUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = document.createElement('img');
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 1600;
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to process image'));
            return;
          }
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        image.onerror = () => reject(new Error('Invalid image file'));
        image.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (file: File) => {
    // Validate file format
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedFormats.includes(file.type)) {
      toast({ 
        variant: 'destructive', 
        title: "Invalid Format", 
        description: "Only JPEG, PNG, and WebP images are allowed."
      });
      return;
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({ 
        variant: 'destructive', 
        title: "File Too Large", 
        description: `Maximum file size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
      });
      return;
    }

    try {
      const optimizedImage = await compressImageForUpload(file);
      setPhoto(optimizedImage);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Image Processing Failed',
        description: 'Could not process this image. Please try another photo.',
      });
    }
  };

  const calculateShipping = async () => {
    if (!weight || !length || !width || !height) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Please enter all dimensions.' });
      return;
    }

    setIsCalculatingShipping(true);
    try {
      // Placeholder for actual shipping calculation
      // In production, call Shippo API
      const rate = parseFloat(weight) * 2 + (parseFloat(length) + parseFloat(width) + parseFloat(height)) * 0.1;
      setCalculatedShippingCost(Math.round(rate * 100) / 100);
      toast({ title: 'Calculated', description: `Shipping cost: $${Math.round(rate * 100) / 100}` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Calculation Failed', description: getFriendlyErrorMessage(error) });
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !title || !price || !category || !listingRef) return;

    setIsSubmitting(true);

    try {
      const sanitizedTitle = filterProfanity(title);
      const sanitizedDescription = filterProfanity(description);

      // Upload new image if photo was changed (and is a data URL)
      let imageUrl = photo;
      if (photo && photo.startsWith('data:')) {
        imageUrl = await uploadPhotoToStorage(photo);
      }

      const updateData = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: parseFloat(price),
        category,
        condition,
        visibility,
        tags,
        shippingType,
        weight: shippingType === 'Paid' ? parseFloat(weight) || null : null,
        length: shippingType === 'Paid' ? parseFloat(length) || null : null,
        width: shippingType === 'Paid' ? parseFloat(width) || null : null,
        height: shippingType === 'Paid' ? parseFloat(height) || null : null,
        shippingCost: calculatedShippingCost || null,
        isGraded: isGraded,
        gradingCompany: isGraded ? gradingCompany : null,
        gradingGrade: isGraded ? gradingGrade : null,
        quantity: type === 'bin' ? Math.max(1, parseInt(quantity) || 1) : null, // Stock tracking for Buy It Now
        imageUrl: imageUrl,
        updatedAt: serverTimestamp()
      };

      // Note: Type cannot be changed after creation
      // expiresAt and other temporal fields are immutable

      await updateDoc(listingRef, updateData);
      toast({ title: 'Updated!', description: 'Your listing has been updated successfully.' });
      router.push(`/listings/${id}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: getFriendlyErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-2xl text-center">
          <p className="text-muted-foreground font-black uppercase tracking-widest">Listing not found</p>
          <Button asChild className="mt-6">
            <Link href="/">Back to Home</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="ghost" size="lg" className="rounded-xl">
            <Link href={`/listings/${id}`}><ArrowLeft className="w-5 h-5 mr-2" /> Back</Link>
          </Button>
          <h1 className="text-3xl font-headline font-black uppercase tracking-tighter">Edit Listing</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Photo Section */}
          <section className="bg-zinc-50 p-8 rounded-2xl border-2 border-dashed space-y-6">
            <Label className="text-xs font-black uppercase tracking-widest">Item Photo</Label>
            {photo && (
              <div className="relative aspect-video rounded-xl overflow-hidden border-2">
                <Image src={photo} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  aria-label="Remove selected photo"
                  title="Remove selected photo"
                  onClick={() => setPhoto('')}
                  className="absolute top-4 right-4 bg-zinc-950/50 text-white rounded-full p-2 backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  handlePhotoUpload(file);
                }
              }}
              className="h-12 border-2 rounded-xl cursor-pointer"
            />
            <p className="text-xs text-muted-foreground font-medium">Upload a new photo or leave empty to keep current</p>
          </section>

          {/* Basic Info Section */}
          <section className="bg-zinc-50 p-8 rounded-2xl border-2 border-dashed space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest">Title</Label>
              <Input
                id="title"
                placeholder="Item name..."
                className="h-12 rounded-xl border-2 font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-black uppercase tracking-widest">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-xl border-2 font-bold" />
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition" className="text-xs font-black uppercase tracking-widest">Condition</Label>
                <Select
                  value={condition}
                  onValueChange={(val) => setCondition(val as 'New' | 'Like New' | 'Used')}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 font-bold" />
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
                  <Label htmlFor="edit-is-graded" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="edit-is-graded"
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

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Tags</Label>
              <div className="flex gap-2 mb-3 flex-wrap">
                {tags.map(tag => (
                  <div
                    key={tag}
                    className="bg-accent/10 text-accent text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove tag ${tag}`}
                      title={`Remove tag ${tag}`}
                      onClick={() => setTags(tags.filter(t => t !== tag))}
                      className="hover:text-accent/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag (press Enter)..."
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

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell buyers about the condition..."
                className="min-h-[120px] rounded-xl border-2 font-medium"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Visibility</Label>
              <RadioGroup value={visibility} onValueChange={(val) => setVisibility(val as 'Visible' | 'Invisible')}>
                <div className={cn("flex flex-col gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer", visibility === 'Visible' ? "bg-white border-accent shadow-lg" : "bg-transparent border-zinc-200")}>
                  <RadioGroupItem value="Visible" id="vis-visible" className="sr-only" />
                  <Label htmlFor="vis-visible" className="cursor-pointer flex flex-col gap-1">
                    <span className="font-black uppercase tracking-widest text-xs">Visible</span>
                    <span className="text-[9px] text-muted-foreground font-medium">Show in browse & shop</span>
                  </Label>
                </div>
                <div className={cn("flex flex-col gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer", visibility === 'Invisible' ? "bg-white border-accent shadow-lg" : "bg-transparent border-zinc-200")}>
                  <RadioGroupItem value="Invisible" id="vis-invisible" className="sr-only" />
                  <Label htmlFor="vis-invisible" className="cursor-pointer flex flex-col gap-1">
                    <span className="font-black uppercase tracking-widest text-xs">Invisible</span>
                    <span className="text-[9px] text-muted-foreground font-medium">Only you can see</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </section>

          {/* Pricing Section */}
          <section className="bg-zinc-50 p-8 rounded-2xl border-2 border-dashed space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">Price</h3>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest">
                {type === 'auction' ? 'Starting Bid' : 'Buy It Now Price'}
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black">$</span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="h-12 pl-8 rounded-xl border-2 font-bold text-lg"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            {type === 'bin' && (
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-xs font-black uppercase tracking-widest">Quantity Available</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  className="h-12 rounded-xl border-2 font-bold"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground font-medium">How many items are you selling?</p>
              </div>
            )}

            <Alert className="border-2 bg-accent/5 border-accent/20">
              <AlertTitle className="font-black text-accent uppercase text-[10px]">Note</AlertTitle>
              <AlertDescription className="text-xs font-medium mt-2">
                Listing type (Auction vs Buy It Now) cannot be changed after creation.
              </AlertDescription>
            </Alert>
          </section>

          {/* Shipping Section */}
          <section className="bg-zinc-50 p-8 rounded-2xl border-2 border-dashed space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-xl"><Truck className="w-6 h-6 text-accent" /></div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Shipping</h3>
                <p className="text-xs text-muted-foreground font-bold">Update delivery options.</p>
              </div>
            </div>
            <RadioGroup value={shippingType} onValueChange={(val) => setShippingType(val as 'Free' | 'Paid')}>
              <div className={cn("flex flex-col gap-2 p-6 rounded-xl border-2 transition-all cursor-pointer", shippingType === 'Free' ? "bg-white border-accent shadow-lg" : "bg-transparent border-zinc-200")}>
                <RadioGroupItem value="Free" id="ship-free" className="sr-only" />
                <Label htmlFor="ship-free" className="cursor-pointer font-black uppercase tracking-widest text-xs">Free Shipping</Label>
              </div>
              <div className={cn("flex flex-col gap-2 p-6 rounded-xl border-2 transition-all cursor-pointer", shippingType === 'Paid' ? "bg-white border-accent shadow-lg" : "bg-transparent border-zinc-200")}>
                <RadioGroupItem value="Paid" id="ship-paid" className="sr-only" />
                <Label htmlFor="ship-paid" className="cursor-pointer font-black uppercase tracking-widest text-xs">Paid Shipping</Label>
              </div>
            </RadioGroup>

            {shippingType === 'Paid' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Weight (lbs)</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl border-2"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Dimensions (L×W×H)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="L"
                        type="number"
                        className="h-12 border-2 rounded-xl"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                      <Input
                        placeholder="W"
                        type="number"
                        className="h-12 border-2 rounded-xl"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                      <Input
                        placeholder="H"
                        type="number"
                        className="h-12 border-2 rounded-xl"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={calculateShipping}
                  disabled={isCalculatingShipping}
                  className="w-full bg-zinc-950 text-white font-black rounded-xl h-12"
                >
                  {isCalculatingShipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                  Calculate Shipping Rate
                </Button>
                {calculatedShippingCost && (
                  <div className="p-4 bg-accent/5 rounded-xl border border-accent/20">
                    <p className="text-xs font-bold text-accent">Estimated Shipping: ${calculatedShippingCost.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black h-16 text-lg rounded-2xl shadow-xl transition-all active:scale-95 uppercase italic tracking-tighter"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </Button>
        </form>
      </main>
    </div>
  );
}
