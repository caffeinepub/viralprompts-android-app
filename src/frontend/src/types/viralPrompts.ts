// TypeScript types matching the viralprompts.in/data.json structure
export interface ViralPrompt {
  title: string;
  description: string;
  prompt: string;
  image: string;
  categories: string[];
  howToUse: string;
  urlTitle: string;
  id: number;
  copiedCount: number;
  createdDate: string;
}

export interface ViralPromptsResponse {
  prompts: ViralPrompt[];
}
