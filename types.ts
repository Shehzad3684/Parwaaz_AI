export enum GameState {
  MAIN_MENU,
  TUTORIAL_INTRO,
  TUTORIAL_CALL,
  IN_CALL,
  DEBRIEF,
}

export enum UnitType {
  POLICE = 'Police',
  FIRE = 'Fire',
  EMS_BLS = 'EMS (BLS)',
  EMS_ALS = 'EMS (ALS)',
  SWAT = 'SWAT'
}

export interface Scenario {
  id: string;
  title: string;
  shift: number;
  systemInstruction: string;
  keyInfo: string[];
  requiredActions: UnitType[];
}

export interface DispatchUnit {
  name: UnitType;
  dispatched: boolean;
}

export interface CallData {
  address: string;
  description: string;
  notes: string;
  dispatchedUnits: UnitType[];
}

export interface DebriefData {
  score: number;
  feedback: {
    responseTime: string;
    dispatchAccuracy: string;
    toneManagement: string;
    protocolAdherence: string;
    overallCritique: string;
  };
  audioBase64: string | null;
}

export interface TranscriptionEntry {
  speaker: 'user' | 'caller';
  text: string;
  timestamp: number;
}

export interface MapUnit {
  id: string;
  type: UnitType;
  x: number; // percentage
  y: number; // percentage
  status: 'enroute' | 'onscene';
}

export interface Location {
  x: number; // percentage
  y: number; // percentage
}