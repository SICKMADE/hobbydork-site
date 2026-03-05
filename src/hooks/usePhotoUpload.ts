import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function usePhotoUpload() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const compressImageForUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new window.Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200;
          let width = image.width;
          let height = image.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE = 5 * 1024 * 1024;
    let newPhotos: string[] = [];
    setLoading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedFormats.includes(file.type)) {
        toast({ 
          variant: 'destructive', 
          title: 'Invalid Format', 
          description: 'Only JPEG, PNG, and WebP images are allowed.'
        });
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast({ 
          variant: 'destructive', 
          title: 'File Too Large', 
          description: `Maximum file size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
        });
        continue;
      }
      try {
        const optimizedImage = await compressImageForUpload(file);
        newPhotos.push(optimizedImage);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Image Processing Failed',
          description: 'Could not process this image. Please try another photo.',
        });
      }
    }
    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos]);
    }
    setLoading(false);
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  return {
    photos,
    setPhotos,
    loading,
    handlePhotoUpload,
    removePhoto,
  };
}
