import { ReactNode, CSSProperties } from 'react';

export interface ExperienceItem {
  id?: string;
  role: string;
  company: string;
  period: string;
  location: string;
  highlights?: string[];
}

export interface EducationInfo {
  degree: string;
  institution: string;
  period: string;
}

export interface ProjectInfo {
  name: string;
  description: string;
  link: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  linkedin: string;
  location: string;
}

export type SkillCategoryId =
  | 'frameworks'
  | 'languages'
  | 'webTech'
  | 'aiSkills'
  | 'aiTools'
  | 'buildTools'
  | 'linting'
  | 'others'
  | 'leadership';

export interface CategoryMeta {
  id: SkillCategoryId;
  label: string;
  translationKey: SkillCategoryId;
  color: string;
  bgLight: string;
  icon: ReactNode;
}

export interface CategoryConfig extends CategoryMeta {
  data: string[];
  customStyle?: CSSProperties;
}

export type SkillsDictionary = Record<SkillCategoryId, string[]>;

export type SectionId = 'home' | 'experience' | 'skills' | 'education' | 'projects' | 'chat';

export interface NavLinkItem {
  id: SectionId;
  href: string;
  labelKey: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AiChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  error: string | null;
}