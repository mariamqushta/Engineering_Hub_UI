export interface Lesson {
  id: number;
  title: string;
  description: string;
  order: number;
  isUnlocked?: boolean;
}