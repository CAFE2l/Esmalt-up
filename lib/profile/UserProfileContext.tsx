"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import { updateProfile as updateFirebaseAuthProfile } from "firebase/auth";

interface UserProfile {
  name: string;
  email: string;
  profilePhotoUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  city: string;
  level: string;
  experienceYears: string;
  favoriteBrands: string;
  favoriteStyles: string;
  equipment: string;
  courseInProgress: string;
  status: string;
  interests: string[];
  badges: string[];
  isEntrepreneur: boolean;
  services: string[];
  pricing: string | null;
  bookingLink: string | null;
  youtube: string | null;
  instagram: string | null;
  tiktok: string | null;
}

interface UserProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Update methods
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePhotoUrl: (url: string | null) => Promise<void>;
  updateBannerUrl: (url: string | null) => Promise<void>;
  
  // Force refresh from server
  refreshProfile: () => Promise<void>;
  
  // Save status for UI feedback
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  saveError: string | null;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch profile data from API
  const fetchProfile = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/profile", {
        headers: { authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar perfil");
      }
      
      const data = await response.json();
      const serverProfile = data.profile;
      
      const mappedProfile: UserProfile = {
        name: serverProfile.name || user?.displayName || "",
        email: serverProfile.email || user?.email || "",
        profilePhotoUrl: serverProfile.profilePhotoUrl || serverProfile.avatarUrl || user?.photoURL || null,
        bannerUrl: serverProfile.bannerUrl || null,
        bio: serverProfile.bio || "",
        city: serverProfile.city || "",
        level: serverProfile.level || "Iniciante",
        experienceYears: serverProfile.experienceYears || "",
        favoriteBrands: serverProfile.favoriteBrands || "",
        favoriteStyles: serverProfile.favoriteStyles || "",
        equipment: serverProfile.equipment || "",
        courseInProgress: serverProfile.courseInProgress || "",
        status: serverProfile.status || "Disponível para atendimentos",
        interests: serverProfile.interests || [],
        badges: serverProfile.badges || [],
        isEntrepreneur: serverProfile.isEntrepreneur || false,
        services: serverProfile.services || [],
        pricing: serverProfile.pricing || null,
        bookingLink: serverProfile.bookingLink || null,
        youtube: serverProfile.youtube || null,
        instagram: serverProfile.instagram || null,
        tiktok: serverProfile.tiktok || null,
      };
      
      setProfile(mappedProfile);
      setLoading(false);
      
    } catch (err) {
      console.error("[UserProfileContext] Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil");
      setLoading(false);
    }
  }, [user]);

  // Update Firebase auth profile and our context
  const updateFirebaseProfile = useCallback(async (updates: { displayName?: string; photoURL?: string | null }) => {
    if (!user) return;
    
    try {
      // Only update Firebase if we have changes to supported fields
      const hasUpdates = updates.displayName !== undefined || updates.photoURL !== undefined;
      if (hasUpdates) {
        const firebaseUpdates: { displayName?: string; photoURL?: string | null } = {};
        if (updates.displayName !== undefined) {
          firebaseUpdates.displayName = updates.displayName;
        }
        if (updates.photoURL !== undefined) {
          firebaseUpdates.photoURL = updates.photoURL;
        }
        
        await updateFirebaseAuthProfile(user, firebaseUpdates);
        
        // Force refresh the Firebase auth state to pick up changes
        await user.reload();
      }
    } catch (err) {
      console.error("[UserProfileContext] Error updating Firebase profile:", err);
      // Don't fail the entire operation if Firebase update fails
    }
  }, [user]);

  // Refresh profile from server
  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    
    try {
      const token = await user.getIdToken();
      await fetchProfile(token);
    } catch (err) {
      console.error("[UserProfileContext] Error refreshing profile:", err);
      setError(err instanceof Error ? err.message : "Erro ao atualizar perfil");
    }
  }, [user, fetchProfile]);

  // Update profile data - this is the main method for profile updates
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    setSaveStatus('saving');
    setSaveError(null);
    
    try {
      const token = await user.getIdToken();
      
      // Prepare data for API
      const apiUpdates: Record<string, unknown> = {};
      
      // Map our context fields to API fields
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.profilePhotoUrl !== undefined) apiUpdates.profilePhotoUrl = updates.profilePhotoUrl;
      if (updates.bannerUrl !== undefined) apiUpdates.bannerUrl = updates.bannerUrl;
      if (updates.bio !== undefined) apiUpdates.bio = updates.bio;
      if (updates.city !== undefined) apiUpdates.city = updates.city;
      if (updates.level !== undefined) apiUpdates.level = updates.level;
      if (updates.experienceYears !== undefined) apiUpdates.experienceYears = updates.experienceYears;
      if (updates.favoriteBrands !== undefined) apiUpdates.favoriteBrands = updates.favoriteBrands;
      if (updates.favoriteStyles !== undefined) apiUpdates.favoriteStyles = updates.favoriteStyles;
      if (updates.equipment !== undefined) apiUpdates.equipment = updates.equipment;
      if (updates.courseInProgress !== undefined) apiUpdates.courseInProgress = updates.courseInProgress;
      if (updates.status !== undefined) apiUpdates.status = updates.status;
      if (updates.interests !== undefined) apiUpdates.interests = updates.interests;
      if (updates.badges !== undefined) apiUpdates.badges = updates.badges;
      if (updates.isEntrepreneur !== undefined) apiUpdates.isEntrepreneur = updates.isEntrepreneur;
      if (updates.services !== undefined) apiUpdates.services = updates.services;
      if (updates.pricing !== undefined) apiUpdates.pricing = updates.pricing;
      if (updates.bookingLink !== undefined) apiUpdates.bookingLink = updates.bookingLink;
      if (updates.youtube !== undefined) apiUpdates.youtube = updates.youtube;
      if (updates.instagram !== undefined) apiUpdates.instagram = updates.instagram;
      if (updates.tiktok !== undefined) apiUpdates.tiktok = updates.tiktok;
      
      // Send updates to server
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(apiUpdates),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar perfil");
      }
      
      // Update local context
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Update Firebase auth if name or photo changed
      const firebaseUpdates: { displayName?: string; photoURL?: string | null } = {};
      if (updates.name !== undefined) {
        firebaseUpdates.displayName = updates.name;
      }
      if (updates.profilePhotoUrl !== undefined) {
        firebaseUpdates.photoURL = updates.profilePhotoUrl;
      }
      
      if (Object.keys(firebaseUpdates).length > 0) {
        await updateFirebaseProfile(firebaseUpdates);
      }
      
      setSaveStatus('success');
      
      // Auto-reset success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
      
      // Refresh profile from server to ensure consistency
      await refreshProfile();
      
    } catch (err) {
      console.error("[UserProfileContext] Error updating profile:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar perfil";
      setSaveError(errorMessage);
      setSaveStatus('error');
      
      // Auto-reset error status after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveError(null);
      }, 5000);
    }
  }, [user, updateFirebaseProfile, refreshProfile]);

  // Dedicated method for photo URL updates (used by image uploaders)
  const updatePhotoUrl = useCallback(async (url: string | null) => {
    await updateProfile({ profilePhotoUrl: url });
  }, [updateProfile]);

  // Dedicated method for banner URL updates
  const updateBannerUrl = useCallback(async (url: string | null) => {
    await updateProfile({ bannerUrl: url });
  }, [updateProfile]);

  // Initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    const loadProfile = async () => {
      try {
        const token = await user.getIdToken();
        await fetchProfile(token);
      } catch (err) {
        console.error("[UserProfileContext] Initial load error:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar perfil");
        setLoading(false);
      }
    };
    
    loadProfile();
    
    // Set up periodic refresh to keep data in sync across tabs
    const intervalId = setInterval(loadProfile, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [user, authLoading, fetchProfile]);

  // Provide value to consumers
  const value: UserProfileContextValue = {
    profile,
    loading,
    error,
    updateProfile,
    updatePhotoUrl,
    updateBannerUrl,
    refreshProfile,
    saveStatus,
    saveError,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile deve ser usado dentro de <UserProfileProvider>");
  }
  return context;
}