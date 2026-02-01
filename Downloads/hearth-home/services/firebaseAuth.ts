/**
 * Firebase Auth service stub.
 * Actual authentication is handled by mockAuth in context/AuthContext.tsx
 */
export const firebaseAuth = {
  async signUp(name: string, email: string, pass: string) {
    throw new Error("Firebase is not configured. Use mock auth.");
  },

  async signIn(email: string, pass: string) {
    throw new Error("Firebase is not configured. Use mock auth.");
  },

  async logout() {
    return;
  }
};