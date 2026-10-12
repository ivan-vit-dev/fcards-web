import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// Rules only let superAdmins write seed collections, so scripts sign in as one.
export async function connectAsAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (a user whose users/{uid}.role is \"superAdmin\")."
    );
  }

  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  await signInWithEmailAndPassword(getAuth(app), email, password);
  return getFirestore(app);
}

export async function upsert(
  db: ReturnType<typeof getFirestore>,
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<"created" | "updated"> {
  const ref = doc(db, collectionName, id);
  const exists = (await getDoc(ref)).exists();
  await setDoc(
    ref,
    {
      ...data,
      ...(exists ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return exists ? "updated" : "created";
}
