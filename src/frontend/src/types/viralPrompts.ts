// TypeScript types matching the viralprompts.in/data.json structure
export interface ViralPrompt {
  title: string;
  description: string | null;
  prompt: string;
  image: string | null;
  categories: string[] | null;
  howToUse: string | null;
  urlTitle: string;
  id: number;
  copiedCount: number | null;
  createdDate: string | null;
}

export interface ViralPromptsResponse {
  prompts: ViralPrompt[];
}
