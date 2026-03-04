import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  user_id: string;
  email: string;
  plan: 'free' | 'pro';
  credits: number;
  created_at: string;
}

export interface AnalysisJson {
  productType: string;
  mainColors: string[];
  style: string;
  material: string;
  targetAudience: string;
  marketingAngles: string[];
}

export interface GeneratedContent {
  title: string;
  caption: string;
  hashtags: string[];
  bulletPoints: string[];
  description: string;
  priceSuggestion: string;
}

export interface Project {
  id: string;
  userId: string;
  originalImageUrl: string; // Base64 or URL
  analysis: AnalysisJson | null;
  prompts: { angle: string; prompt: string }[] | null;
  content: GeneratedContent | null;
  settings: {
    platform: string;
    mood: 'Studio' | 'Lifestyle';
    aspectRatio: '1:1' | '4:5' | '9:16';
  };
  status: 'draft' | 'analyzing' | 'generating_prompts' | 'generating_images' | 'completed' | 'failed';
  createdAt: string;
}

export interface GeneratedImage {
  id: string;
  projectId: string;
  angle: string;
  prompt: string;
  imageUrl: string;
}

interface AppState {
  user: User;
  projects: Project[];
  generatedImages: GeneratedImage[];
  deductCredits: (amount: number) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  addGeneratedImage: (image: GeneratedImage) => void;
  setGeneratedImages: (images: GeneratedImage[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: {
        user_id: 'user-1',
        email: 'demo@example.com',
        plan: 'free',
        credits: 100,
        created_at: new Date().toISOString(),
      },
      projects: [],
      generatedImages: [],
      deductCredits: (amount) =>
        set((state) => ({
          user: { ...state.user, credits: Math.max(0, state.user.credits - amount) },
        })),
      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),
      updateProject: (id, data) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),
      addGeneratedImage: (image) =>
        set((state) => ({ generatedImages: [...state.generatedImages, image] })),
      setGeneratedImages: (images) =>
        set((state) => ({ generatedImages: images })),
    }),
    {
      name: 'ai-lookbook-storage',
    }
  )
);
