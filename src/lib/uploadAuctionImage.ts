import { storage } from '@/firebase/client-provider';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file File to upload
 * @param path Storage path (e.g. 'blindBidderImages/filename.jpg')
 */
export async function uploadAuctionImage(file: File, path: string): Promise<string> {
  if (!storage) throw new Error('Firebase storage not initialized');
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
