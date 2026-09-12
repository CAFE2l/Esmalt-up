import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function parsePrivateKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/\\n/g, "\n");
  const match = normalized.match(
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/,
  );
  return match?.[0];
}

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID,
  clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  privateKey: parsePrivateKey(process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY),
};

if (!getApps().length) {
  initializeApp({ credential: cert(firebaseAdminConfig) });
}

export const adminAuth = getAuth();

export async function verifyIdToken(token: string) {
  return adminAuth.verifyIdToken(token);
}