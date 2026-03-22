export interface CreateProfileInput {
  displayName: string;
  age: number;
  avatarUrl?: string;
}

export interface ProfileResponse {
  id: string;
  displayName: string;
  age: number;
  avatarUrl: string | null;
  storyCount: number;
}
