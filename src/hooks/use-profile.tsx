'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Profile {
  id: string;
  displayName: string;
  age: number;
  avatarUrl: string | null;
  storyCount: number;
}

interface ProfileContextType {
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  setProfile: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  return <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
