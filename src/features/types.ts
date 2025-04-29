interface StoreDataFramesMessage {
  type: "store-data-frames";
  target: "db";
  frames: DataFrame[];
}

interface StorePositionFramesMessage {
  type: "store-position-frames";
  target: "db";
  frames: PositionFrame[];
}

interface QueryMessage {
  type: "query";
  target: "db";
  query: string;
}

export type DbInterfaceMessage =
  | QueryMessage
  | StoreDataFramesMessage
  | StorePositionFramesMessage;

export interface DataFrame {
  ts: number;
  id: number;
  hex?: string;
  squawk?: string;
  flight?: string;
  reg?: string;
  type?: string | null;
  source: string;
}

export interface PositionFrame {
  ts: number;
  id: number;
  lat: number;
  lon: number;
  callsign: string;
  alt: number;
  speed?: number;
  heading?: number;
  source: string;
}
