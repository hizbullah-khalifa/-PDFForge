export type CategoryId = "convert" | "organize" | "optimize" | "edit" | "security" | "other";

export interface OptionField {
  key: string;
  label: string;
  type: "text" | "password" | "number" | "select" | "range" | "checkbox" | "color" | "file" | "hidden";
  default?: any;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  accept?: string[];
  hint?: string;
  wide?: boolean;
}

export interface ToolFaq {
  q: string;
  a: string;
}

export type ToolMode = "standard" | "editor" | "viewer" | "signature";

export interface ToolDef {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: CategoryId;
  icon: string;
  accept: string[];
  multiple?: boolean;
  minFiles?: number;
  maxFiles?: number;
  engine?: string;
  mode?: ToolMode;
  editorPreset?: string;
  options?: OptionField[];
  steps: string[];
  faqs: ToolFaq[];
  popular?: boolean;
  keywords: string[];
}

export interface CategoryDef {
  id: CategoryId;
  label: string;
  icon: string;
  blurb: string;
}
