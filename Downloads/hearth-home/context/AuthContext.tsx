import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { User, UserRole } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyPhone: (phoneNumber: string) => Promise<void>;
  loading: boolean;
  isNewSignup: boolean;
  clearNewSignupParams: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewSignup, setIsNewSignup] = useState(false);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    if (!auth) {
      console.warn("Firebase Auth not initialized");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user details from Firestore if needed
        // For now, we'll map the Firebase User to our app's User type
        // Check if user exists in Firestore 'users' collection for roles/verification
        let appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          role: UserRole.USER, // Default role
          photoURL: firebaseUser.photoURL || undefined,
          isVerified: false,
          phoneNumber: firebaseUser.phoneNumber || undefined
        };

        if (db) {
            try {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    appUser = { ...appUser, ...userData };
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        }
        
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Successfully logged in!");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(`Login failed: ${error.message}`);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Create user document in Firestore
      if (db) {
        const newUser: User = {
            uid: userCredential.user.uid,
            email: email,
            displayName: name,
            role: UserRole.USER,
            isVerified: false,
            createdAt: Date.now()
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
        // Also update local state to reflect Immediately
        setUser(newUser);
      }

      setIsNewSignup(true);
      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(`Signup failed: ${error.message}`);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsNewSignup(false);
      toast.success("Logged out");
    } catch (error: any) {
        toast.error("Error logging out");
    }
  };

  const verifyPhone = async (phoneNumber: string) => {
    // Note: Real phone verification requires reCAPTCHA verifier and more complex setup.
    // For this MVP/Migration, we will just update the user record in Firestore.
    if (!user || !db) return;
    
    try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { phoneNumber, isVerified: true }, { merge: true }); // Mocking successful verification
        
        setUser(prev => prev ? ({ ...prev, phoneNumber, isVerified: true }) : null);
        toast.success("Phone verified!");
    } catch (error: any) {
        toast.error("Failed to verify phone");
    }
  };

  const clearNewSignupParams = () => setIsNewSignup(false);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, verifyPhone, loading, isNewSignup, clearNewSignupParams }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};