export type AssetStatus = 'draft' | 'review' | 'changes' | 'approved';

export interface ProjectSummary {
  id: string;
  name: string;
  path: string;
  opened_at: number;
  active: boolean;
  missing: boolean;
  assets: number;
  approved: number;
  feedback: number;
  cover: string[];
}

export interface AssetSummary {
  id: number;
  key: string;
  type: string;
  style: string;
  width: number;
  height: number;
  duration: number;
  frames: number;
  nineSlice: number[] | null;
  status: AssetStatus;
  updated_at: number;
  revision: number;
  open_feedback: number;
  format: 'svg' | 'html';
}

export interface Lint {
  meta: Record<string, any>;
  errors: string[];
  warnings: string[];
}

export interface Revision {
  number: number;
  source: 'ai' | 'disk' | 'restore' | 'user';
  note: string;
  lint: Lint | null;
  critique: { scores?: Record<string, number>; notes?: string } | null;
  created_at: number;
}

export interface Feedback {
  id: number;
  revision: number | null;
  body: string;
  x: number | null;
  y: number | null;
  status: 'open' | 'resolved';
  reply: string;
  created_at: number;
  resolved_at: number | null;
}

export interface AssetDetail extends Omit<AssetSummary, 'revision' | 'open_feedback'> {
  revisions: Revision[];
  feedback: Feedback[];
  variants: { key: string; status: AssetStatus }[];
}

export interface Activity {
  id: number;
  actor: 'user' | 'ai' | 'system';
  kind: string;
  message: string;
  asset: string | null;
  created_at: number;
}

export const ASSET_TYPES = ['button', 'panel', 'frame', 'bar', 'icon', 'vfx', 'background', 'mockup', 'other'] as const;

export const STATUS_META: Record<AssetStatus, { label: string; tone: string; dot: string }> = {
  draft: { label: 'Draft', tone: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  review: { label: 'Needs review', tone: 'bg-brand/15 text-brand', dot: 'bg-brand' },
  changes: { label: 'Changes requested', tone: 'bg-warning/15 text-warning', dot: 'bg-warning' },
  approved: { label: 'Approved', tone: 'bg-success/15 text-success', dot: 'bg-success' }
};

export const assetUrl = (project: string, key: string, version?: number, format: 'svg' | 'html' = 'svg') => `/files/${project}/assets/${encodeURIComponent(key)}.${format}${version ? `?v=${version}` : ''}`;
/** Server-rendered PNG: works for every format and shows animations mid-way. */
export const thumbUrl = (project: string, key: string, version?: number | string, options: { rev?: number; scale?: number } = {}) =>
  `/api/projects/${project}/assets/${encodeURIComponent(key)}/thumb?v=${version ?? ''}${options.rev ? `&rev=${options.rev}` : ''}${options.scale ? `&scale=${options.scale}` : ''}`;
export const revisionUrl = (project: string, key: string, number: number) => `/api/projects/${project}/assets/${encodeURIComponent(key)}/revisions/${number}`;
export const masterKey = (key: string) => key.split('.')[0]!;

export function errorMessage(error: any): string {
  return error?.data?.message ?? error?.statusMessage ?? error?.message ?? 'Something went wrong';
}
