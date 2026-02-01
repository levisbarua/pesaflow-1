import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    QueryConstraint,
    startAt,
    endAt
} from 'firebase/firestore/lite';
import { db } from './firebaseConfig';
import { Listing, FilterState, FeedbackData, User, UserRole, ListingType } from '../types';

const LISTINGS_COLLECTION = 'listings';
const USERS_COLLECTION = 'users'; // We might store agents here
const REPORTS_COLLECTION = 'reports';
const FEEDBACK_COLLECTION = 'feedback';
const CONTACT_MESSAGES_COLLECTION = 'contact_messages';

export const firestoreService = {
    // ---------------------------------------------------------------------------
    // LISTINGS
    // ---------------------------------------------------------------------------

    getListings: async (filters: FilterState): Promise<Listing[]> => {
        if (!db) {
            console.warn("Firestore not initialized");
            return [];
        }

        const listingsRef = collection(db, LISTINGS_COLLECTION);
        const constraints: QueryConstraint[] = [];

        // Base filter: Only show active listings
        constraints.push(where('status', '==', 'active'));

        // Apply filters
        if (filters.type) {
            constraints.push(where('type', '==', filters.type));
        }

        // Note: Range filters and Sorting often require Composite Indexes in Firestore.
        // If you see a "Precondition Failed" error in console with a link, click it to create the index.

        if (filters.minPrice) {
            constraints.push(where('price', '>=', filters.minPrice));
        }

        if (filters.maxPrice) {
            constraints.push(where('price', '<=', filters.maxPrice));
        }

        // Specific Bedroom Logic
        if (filters.bedrooms) {
            if (filters.bedrooms === '4+') {
                constraints.push(where('bedrooms', '>=', 4));
            } else {
                constraints.push(where('bedrooms', '==', Number(filters.bedrooms)));
            }
        } else if (filters.minBeds) {
            constraints.push(where('bedrooms', '>=', filters.minBeds));
        }

        // City Filter (Simple Prefix Match)
        // "Nairobi" -> starts with "Nairobi"
        if (filters.city) {
            // Normalize checking capital case if data is consistent
            // Firestore is case sensitive.
            // Doing a simple equality check is safer without full text search engine (Algolia/Typesense)
            // Or we can try the range trick:
            // constraints.push(where('location.city', '>=', filters.city));
            // constraints.push(where('location.city', '<=', filters.city + '\uf8ff'));

            // For MVP, lets try equality to avoid index explosion on too many fields
            // Or if the mock used 'includes', we can't easily replicate that in NoSQL without full text search
            // We will assume exact city match for now or just skip if it's too complex for basic FS
            // Let's try to match the city field directly if cleaner.
            // Actually, let's just not filter by city in query for now if it requires complex index with Price,
            // unless we are sure.
            // Let's do client side filtering for City if the result set is small, 
            // BUT for a "Real" backend, we should try.
            // Let's stick to filters that likely share an index or don't conflict.

            // Note: You cannot have range filters on different fields (Price vs City) easily without specific setup.
            // We will Apply City filter *after* fetching if other range filters exist to avoid errors,
            // OR just try to push it if we assume users make indexes.

            // Let's filter in memory for City to be safe against "Inequality on multiple fields" error 
            // which plagues new Firestore users.
        }

        // SORTING
        // We want Featured first, then Newest.
        // constraints.push(orderBy('featured', 'desc'));
        // constraints.push(orderBy('createdAt', 'desc'));

        try {
            const q = query(listingsRef, ...constraints);
            const snapshot = await getDocs(q);

            let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));

            // Manual In-Memory Sorting/Filtering for things hard to index dynamically
            if (filters.city) {
                const searchCity = filters.city.toLowerCase();
                results = results.filter(l => l.location.city.toLowerCase().includes(searchCity));
            }

            // Manual Sort to avoid complex index requirements during development
            results.sort((a, b) => {
                const featuredA = a.featured ? 1 : 0;
                const featuredB = b.featured ? 1 : 0;
                if (featuredA !== featuredB) return featuredB - featuredA;
                return b.createdAt - a.createdAt;
            });

            return results;

        } catch (error) {
            console.error("Error getting listings:", error);
            // Fallback for "Inequality" errors or "Index" errors
            return [];
        }
    },

    getListingById: async (id: string): Promise<Listing | null> => {
        if (!db) return null;
        try {
            const docRef = doc(db, LISTINGS_COLLECTION, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Listing;
            }
            return null;
        } catch (e) {
            console.error("Error getting listing by ID", e);
            return null;
        }
    },

    addListing: async (listing: Omit<Listing, 'id' | 'createdAt' | 'status' | 'reportCount' | 'views'>): Promise<Listing> => {
        if (!db) throw new Error("Firestore not initialized");

        const newListingData = {
            ...listing,
            createdAt: Date.now(),
            status: 'active',
            reportCount: 0,
            views: 0
        };

        const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), newListingData);
        return { id: docRef.id, ...(newListingData as any) } as Listing;
    },

    incrementListingViews: async (id: string) => {
        if (!db) return;
        const docRef = doc(db, LISTINGS_COLLECTION, id);
        // Use atomic increment
        await updateDoc(docRef, {
            views: increment(1)
        });
    },

    reportListing: async (listingId: string, reason: string, userId: string = 'anonymous') => {
        if (!db) return;
        // 1. Add to reports collection
        await addDoc(collection(db, REPORTS_COLLECTION), {
            listingId,
            reason,
            reporterId: userId,
            timestamp: Date.now()
        });

        // 2. Increment report count on listing
        const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
        // We can transaction this, but simple update is fine for MVP
        // We want to check the new count to potentially suspend.
        // For simplicity, just increment. The Cloud Function would ideally handle suspension.
        // But we can do client-side read-then-write for the suspension logic if needed (unsafe but works).

        const listingSnap = await getDoc(listingRef);
        if (listingSnap.exists()) {
            const data = listingSnap.data();
            const newCount = (data.reportCount || 0) + 1;
            const updates: any = { reportCount: newCount };
            if (newCount >= 3) {
                updates.status = 'suspended';
            }
            await updateDoc(listingRef, updates);
        }
    },

    // ---------------------------------------------------------------------------
    // USERS / AGENTS
    // ---------------------------------------------------------------------------

    getUserById: async (uid: string): Promise<User | null> => {
        if (!db) return null;
        const ref = doc(db, USERS_COLLECTION, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data() as User;
        return null;
    },

    getAgents: async (): Promise<User[]> => {
        if (!db) return [];
        const q = query(collection(db, USERS_COLLECTION), where('role', '==', UserRole.AGENT));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as User);
    },

    // ---------------------------------------------------------------------------
    // FEEDBACK & CONTACT
    // ---------------------------------------------------------------------------

    addFeedback: async (feedback: FeedbackData) => {
        if (!db) return;
        await addDoc(collection(db, FEEDBACK_COLLECTION), feedback);
    },

    submitContactMessage: async (data: any) => {
        if (!db) return;
        await addDoc(collection(db, CONTACT_MESSAGES_COLLECTION), {
            ...data,
            timestamp: Date.now()
        });
    }
};
