"use client";

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react";
import { useUserProfile } from "./UserProfileContext";

interface ProfileContextValue {
  photoUrl: string | null;
  setPhotoUrl: (url: string | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children, initialPhotoUrl = null }: { children: ReactNode; initialPhotoUrl?: string | null }) {
  const { profile, updatePhotoUrl, loading: profileLoading } = useUserProfile();
  const [photoUrl, setPhotoUrlState] = useState<string | null>(initialPhotoUrl);
  
  // Sync with global profile context
  useEffect(() => {
    if (!profileLoading && profile) {
      setPhotoUrlState(profile.profilePhotoUrl || null);
    }
  }, [profileLoading, profile]);

  const setPhotoUrl = useCallback((url: string | null) => {
    setPhotoUrlState(url);
    // Also update the global profile context
    if (profile) {
      updatePhotoUrl(url);
    }
  }, [profile, updatePhotoUrl]);

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
