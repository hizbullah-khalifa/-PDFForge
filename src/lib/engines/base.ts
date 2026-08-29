export interface OutputFile {
  name: string;
  blob: Blob;
}

export interface EngineCtx {
  report: (stage: string, pct?: number) => void;
}

export type ToolPreview =
  | { type: "images"; images: Array<{ url: string; name: string }> }
  | { type: "tables"; tables: Array<{ name: string; rows: string[][] }> }
  | { type: "text"; text: string; fileName: string };

export interface EngineResult {
  outputs: OutputFile[];
  message?: string;
  meta?: Record<string, unknown>;
  preview?: ToolPreview;
}

export type ToolOptions = Record<string, any>;

export type Engine = (files: File[], options: ToolOptions, ctx: EngineCtx) => Promise<EngineResult>;
