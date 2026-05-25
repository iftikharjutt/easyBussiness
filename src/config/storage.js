import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * @param {string} uri - Local URI of the image.
 * @param {string} path - Storage path (e.g., 'receipts/image.jpg').
 */
export const uploadImage = async (uri, path) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Upload Image Error:", error);
    throw error;
  }
};
