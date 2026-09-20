import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import configData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: configData.apiKey,
  authDomain: configData.authDomain,
  projectId: configData.projectId,
  storageBucket: configData.storageBucket,
  messagingSenderId: configData.messagingSenderId,
  appId: configData.appId,
};

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth & Firestore with explicit databaseId from config
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firestore = configData.firestoreDatabaseId
  ? getFirestore(app, configData.firestoreDatabaseId)
  : getFirestore(app);

// Export db alias as mandated by firebase skill
export const db = firestore;

// Test connection to Firestore on initialization
async function testConnection() {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore offline/cached mode active.');
    }
  }
}
testConnection();

export interface SharedBudgetSpace {
  id: string;
  name: string;
  ownerUid: string;
  ownerEmail: string;
  members: string[]; // List of emails and/or UIDs
  inviteCode: string;
  currency: string;
  updatedAt: string;
}

export interface CloudBudgetData {
  budgetId: string;
  accounts: any[];
  categories: any[];
  transactions: any[];
  reservations: any[];
  loans: any[];
  plannedPayments: any[];
  budgetConfig: any;
  settings: any;
  updatedBy: string;
  updatedAt: string;
}

/**
 * Sign in with Google with friendly error translation.
 * Returns the authenticated User, or null if the user cancelled the popup.
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Record user profile in Firestore
    if (user.email) {
      try {
        const userProfileRef = doc(firestore, 'userProfiles', user.uid);
        await setDoc(
          userProfileRef,
          {
            uid: user.uid,
            email: user.email.toLowerCase(),
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            lastLoginAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (profileErr) {
        console.warn('Could not sync user profile record:', profileErr);
      }
    }

    return user;
  } catch (error: any) {
    const code = error?.code || '';
    const msg = error?.message || '';

    // If user cancelled, closed the popup, or popup request was superseded
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      msg.includes('popup-closed-by-user') ||
      msg.includes('cancelled-popup-request')
    ) {
      // Normal user cancellation - return null without throwing or logging as error
      return null;
    } else if (code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please enable popups for this site.');
    } else if (code === 'auth/network-request-failed') {
      throw new Error('Network connection issue. Please check your internet and try again.');
    } else if (code === 'auth/unauthorized-domain') {
      throw new Error('This app domain is not yet authorized in Firebase OAuth console.');
    }
    throw new Error(error?.message || 'Failed to complete Google Sign-in.');
  }
}

/**
 * Sign out
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Generate a friendly 6-character alphanumeric invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Find or create a shared budget space for the user
 */
export async function getOrCreateDefaultSharedBudget(
  user: User,
  initialData: {
    accounts: any[];
    categories: any[];
    transactions: any[];
    reservations: any[];
    loans: any[];
    plannedPayments: any[];
    budgetConfig: any;
    settings: any;
  }
): Promise<SharedBudgetSpace> {
  const userEmail = (user.email || '').toLowerCase();

  // 1. Check if user already has an active budget recorded in their profile
  const userProfileRef = doc(firestore, 'userProfiles', user.uid);
  const userProfileSnap = await getDoc(userProfileRef);

  if (userProfileSnap.exists()) {
    const profileData = userProfileSnap.data();
    if (profileData.activeBudgetId) {
      const budgetRef = doc(firestore, 'budgets', profileData.activeBudgetId);
      const budgetSnap = await getDoc(budgetRef);
      if (budgetSnap.exists()) {
        return budgetSnap.data() as SharedBudgetSpace;
      }
    }
  }

  // 2. Check if user is already a member of any budget space (by email or UID)
  const budgetsRef = collection(firestore, 'budgets');
  const qByEmail = query(budgetsRef, where('members', 'array-contains', userEmail));
  const querySnap = await getDocs(qByEmail);

  if (!querySnap.empty) {
    const foundBudget = querySnap.docs[0].data() as SharedBudgetSpace;
    // Cache active budget id
    await setDoc(userProfileRef, { activeBudgetId: foundBudget.id }, { merge: true });
    return foundBudget;
  }

  // 3. Otherwise, create a new household budget for the user & their partner
  const budgetId = `budget-${user.uid.slice(0, 8)}-${Date.now()}`;
  const inviteCode = generateInviteCode();

  const newBudget: SharedBudgetSpace = {
    id: budgetId,
    name: `${user.displayName ? user.displayName.split(' ')[0] : 'Family'}'s Household`,
    ownerUid: user.uid,
    ownerEmail: userEmail,
    members: [userEmail, user.uid],
    inviteCode,
    currency: initialData.settings?.currency || 'TND',
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(firestore, 'budgets', budgetId), newBudget);

  // Initialize budget data document
  const dataPayload: CloudBudgetData = {
    budgetId,
    accounts: initialData.accounts,
    categories: initialData.categories,
    transactions: initialData.transactions,
    reservations: initialData.reservations,
    loans: initialData.loans,
    plannedPayments: initialData.plannedPayments,
    budgetConfig: initialData.budgetConfig,
    settings: initialData.settings,
    updatedBy: userEmail,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(firestore, 'budgetData', budgetId), dataPayload);

  // Link to user profile
  await setDoc(userProfileRef, { activeBudgetId: budgetId }, { merge: true });

  return newBudget;
}

/**
 * Join an existing budget space using an invite code or by partner email
 */
export async function joinBudgetWithInviteCode(
  user: User,
  inviteCodeOrId: string
): Promise<SharedBudgetSpace | null> {
  const code = inviteCodeOrId.trim().toUpperCase();
  const userEmail = (user.email || '').toLowerCase();
  const budgetsRef = collection(firestore, 'budgets');

  // Search by inviteCode
  let q = query(budgetsRef, where('inviteCode', '==', code));
  let snap = await getDocs(q);

  if (snap.empty) {
    // Try searching directly by document ID
    const directDoc = await getDoc(doc(firestore, 'budgets', inviteCodeOrId.trim()));
    if (directDoc.exists()) {
      const b = directDoc.data() as SharedBudgetSpace;
      const updatedMembers = Array.from(new Set([...b.members, userEmail, user.uid]));
      await updateDoc(doc(firestore, 'budgets', b.id), {
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(
        doc(firestore, 'userProfiles', user.uid),
        { activeBudgetId: b.id },
        { merge: true }
      );
      return { ...b, members: updatedMembers };
    }
    return null;
  }

  const budgetDoc = snap.docs[0];
  const budget = budgetDoc.data() as SharedBudgetSpace;

  const updatedMembers = Array.from(new Set([...budget.members, userEmail, user.uid]));
  await updateDoc(doc(firestore, 'budgets', budget.id), {
    members: updatedMembers,
    updatedAt: new Date().toISOString(),
  });

  await setDoc(
    doc(firestore, 'userProfiles', user.uid),
    { activeBudgetId: budget.id },
    { merge: true }
  );

  return { ...budget, members: updatedMembers };
}

/**
 * Add a partner directly by their email address
 */
export async function addPartnerByEmail(
  budgetId: string,
  partnerEmail: string
): Promise<boolean> {
  const email = partnerEmail.trim().toLowerCase();
  if (!email || !email.includes('@')) return false;

  const budgetRef = doc(firestore, 'budgets', budgetId);
  const snap = await getDoc(budgetRef);
  if (!snap.exists()) return false;

  const budget = snap.data() as SharedBudgetSpace;
  const members = Array.from(new Set([...budget.members, email]));

  await updateDoc(budgetRef, {
    members,
    updatedAt: new Date().toISOString(),
  });

  return true;
}

/**
 * Upload latest budget data to Firestore
 */
export async function syncBudgetDataToCloud(
  budgetId: string,
  data: Omit<CloudBudgetData, 'budgetId' | 'updatedAt'>
): Promise<void> {
  const docRef = doc(firestore, 'budgetData', budgetId);
  const payload: CloudBudgetData = {
    ...data,
    budgetId,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, payload);
}

/**
 * Subscribe in real-time to cloud budget data with safe error suppression
 */
export function subscribeToBudgetData(
  budgetId: string,
  onData: (data: CloudBudgetData) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(firestore, 'budgetData', budgetId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as CloudBudgetData);
      }
    },
    (err) => {
      console.warn('BudgetData subscription warning/offline:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribe in real-time to budget space metadata (e.g. member additions)
 */
export function subscribeToBudgetSpace(
  budgetId: string,
  onSpace: (space: SharedBudgetSpace) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(firestore, 'budgets', budgetId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onSpace(docSnap.data() as SharedBudgetSpace);
      }
    },
    (err) => {
      console.warn('BudgetSpace subscription warning/offline:', err);
      onError?.(err);
    }
  );
}
