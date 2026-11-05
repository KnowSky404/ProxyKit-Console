export type Platform = 'Loon' | 'Quantumult X' | 'sing-box';
export type Category =
  | 'Rule'
  | 'Plugin'
  | 'Script'
  | 'Filter'
  | 'Rewrite'
  | 'Source Rule Set'
  | 'Binary Rule Set';
export interface Resource {
  id: string;
  name: string;
  description: string;
  platform: Platform;
  category: Category;
  providerId: string;
  repository: string;
  path: string;
  url: string;
  format: string;
  revision: string;
  updatedAt: string;
  size: number;
}
export interface Catalog {
  schemaVersion: 1;
  revision: string;
  updatedAt: string;
  resources: Resource[];
}
export interface ResourceDetail {
  resource: Resource;
  content: string | null;
}
export interface ResourceProvider {
  id: string;
  name: string;
  listResources(signal?: AbortSignal): Promise<Resource[]>;
  getResource(id: string, signal?: AbortSignal): Promise<ResourceDetail>;
}
export interface GatewayCapabilities {
  protocolVersion: '1';
  catalog: boolean;
  textPreview: boolean;
  deviceSubscriptions: boolean;
}
