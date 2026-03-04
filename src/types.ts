export interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

export interface MarketingContext {
  platform: string;
  audience: string;
  tone: string;
  price: string;
}
