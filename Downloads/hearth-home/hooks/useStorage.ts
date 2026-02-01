import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../services/firebaseConfig';

export const useStorage = () => {
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!storage) {
        const err = "Storage not initialized";
        setError(err);
        reject(new Error(err));
        return;
      }

      setProgress(0);
      setError(null);

      const userId = auth?.currentUser?.uid || 'anonymous';
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storageRef = ref(storage, `listings/${userId}/${timestamp}_${cleanFileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          setError(error.message);
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUrl(downloadUrl);
          setProgress(100);
          resolve(downloadUrl);
        }
      );
    });
  };

  return { progress, error, url, uploadFile };
};