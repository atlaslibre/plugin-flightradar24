export interface PluginDescriptor {
  type: "actor";
  name: string;
  attribution?: string;
  replay: boolean;
  locate: boolean;
  status: boolean;
}

export interface ActorPosition {
  ts: number;
  lat: number;
  lon: number;
  alt?: number;
  heading?: number;
  speed?: number;
}

export interface ActorTrack {
  id: string;
  track: ActorPosition[];
}
