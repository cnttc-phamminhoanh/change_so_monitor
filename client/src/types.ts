/* Contract with the standalone Node.js backend (same shapes as the cloud app). */

export type SoChangeField = 'crd' | 'country' | 'price' | 'qty' | 'packing' | 'bom';

export type SoChangeDir = 'up' | 'down' | 'swap';

export interface SoChange {
  field: SoChangeField;
  from: string | null;
  to: string;
  dir: SoChangeDir;
  stage: number;
  at: string;
}

export interface SoStageEvent {
  stage: number;
  at: string;
}

export interface SoOrder {
  id: string;
  soNo: string;
  ordId: string | null;
  poDate: string | null;
  crd: string | null;
  country: string | null;
  buyer: string | null;
  season: string | null;
  styles: string[];
  poNos: string[];
  stage: number;
  stageEvents: SoStageEvent[];
  changes: SoChange[];
}

export interface SoDashboardResponse {
  orders: SoOrder[];
}
