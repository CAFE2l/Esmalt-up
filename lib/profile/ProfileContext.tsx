"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ProfileContextValue {
  photoUrl: string | null;
  setPhotoUrl: (url: string | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children, initialPhotoUrl = null }: { children: ReactNode; initialPhotoUrl?: string | null }) {
  const [photoUrl, setPhotoUrlState] = useState<string | null>(initialPhotoUrl);
  const setPhotoUrl = useCallback((url: string | null) => setPhotoUrlState(url), []);
  return (
    <ProfileContext.Provider value={{ photoUrl, setPhotoUrl }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfilePhoto() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfilePhoto must be used inside ProfileProvider");
  return ctx;
}
