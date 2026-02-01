import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebaseConfig';

export const storageService = {
    uploadImage: async (file: File): Promise<string> => {
        if (!storage) throw new Error("Storage not initialized");

        // Create a unique path: listings/{userId}/{timestamp}_{filename}
        const userId = auth?.currentUser?.uid || 'anonymous';
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fullPath = `listings/${userId}/${timestamp}_${cleanFileName}`;

        const storageRef = ref(storage, fullPath);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    }
};
