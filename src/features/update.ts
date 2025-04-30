import Pbf from "pbf";
import { storeDataFrames, storePositionFrames } from "./db-interface";
import { DataFrame, PositionFrame } from "./types";

function base64ToArrayBuffer(base64: string) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

interface FlightUpdateDetails {
  reg?: string | undefined;
  flight?: string | undefined;
  hex?: string | undefined;
  squawk?: string | undefined;
}

interface FlightUpdate {
  id?: number;
  lat?: number;
  lon?: number;
  track?: number;
  alt?: number;
  speed?: number;
  ts?: number;
  callsign?: string | undefined;
  details?: FlightUpdateDetails;
}

interface PlaybackMessage {
  updates?: FlightUpdate[];
}

interface DetailsPositions {
  ts?: number;
  lat?: number;
  lon?: number;
  track?: number;
  alt?: number;
  speed?: number;
}

interface DetailsCurrent {
  id?: number;
  ts?: number;
  lat?: number;
  lon?: number;
  track?: number;
  alt?: number;
  speed?: number;
  callsign?: string;
  squawk?: string;
}

interface DetailsMore {
  reg?: string;
  hex?: string;
  type?: string;
}

interface DetailsFlight {
  flight?: string;
}

interface DetailsMessage {
  current?: DetailsCurrent;
  flight?: DetailsFlight;
  more?: DetailsMore;
  positions?: DetailsPositions[];
}

function readFlightUpdate(tag: number, flight: FlightUpdate, pbf: Pbf) {
  if (tag === 1) flight.id = pbf.readVarint();
  else if (tag === 2) flight.lat = pbf.readFloat();
  else if (tag === 3) flight.lon = pbf.readFloat();
  else if (tag === 4) flight.track = pbf.readVarint();
  else if (tag === 5) flight.alt = pbf.readVarint();
  else if (tag === 6) flight.speed = pbf.readVarint();
  else if (tag === 9) flight.ts = pbf.readVarint();
  else if (tag === 11) flight.callsign = pbf.readString();
  else if (tag === 13)
    flight.details = pbf.readMessage<FlightUpdateDetails>(
      readUpdateFlightDetails,
      {}
    );
}

function readUpdateFlightDetails(
  tag: number,
  data: FlightUpdateDetails,
  pbf: Pbf
) {
  if (tag === 1) data.flight = pbf.readString();
  else if (tag === 2) data.reg = pbf.readString();
  else if (tag === 5) data.squawk = pbf.readVarint().toString(16);
  else if (tag === 14) data.hex = pbf.readVarint().toString(16);
}

function readLiveUpdateMessage(tag: number, data: FlightUpdate[], pbf: Pbf) {
  if (tag === 1 || tag === 3) {
    const flightUpdate = pbf.readMessage<FlightUpdate>(readFlightUpdate, {});
    data.push(flightUpdate);
  }
}

function readPlaybackUpdateMessage(
  tag: number,
  data: PlaybackMessage,
  pbf: Pbf
) {
  if (tag === 1)
    data.updates = pbf.readMessage<FlightUpdate[]>(readLiveUpdateMessage, []);
}

function readDetailsPosition(tag: number, data: DetailsPositions, pbf: Pbf) {
  if (tag === 1) data.ts = pbf.readVarint();
  else if (tag === 2) data.lat = pbf.readFloat();
  else if (tag === 3) data.lon = pbf.readFloat();
  else if (tag === 4) data.alt = pbf.readVarint();
  else if (tag === 5) data.speed = pbf.readVarint();
  else if (tag === 6) data.track = pbf.readVarint();
}

function readDetailsCurrent(tag: number, data: DetailsCurrent, pbf: Pbf) {
  if (tag === 1) data.id = pbf.readVarint();
  else if (tag === 2) data.lat = pbf.readFloat();
  else if (tag === 3) data.lon = pbf.readFloat();
  else if (tag === 4) data.track = pbf.readVarint();
  else if (tag === 5) data.alt = pbf.readVarint();
  else if (tag === 6) data.speed = pbf.readVarint();
  else if (tag === 8) data.ts = Math.trunc(pbf.readVarint() / 1000);
  else if (tag === 10) data.callsign = pbf.readString();
  else if (tag === 15) data.squawk = pbf.readVarint().toString(16);
}

function readDetailsMore(tag: number, data: DetailsMore, pbf: Pbf) {
  if (tag === 1) data.hex = pbf.readVarint().toString(16);
  else if (tag === 2) data.reg = pbf.readString();
  else if (tag === 4) data.type = pbf.readString();
}

function readDetailsFlight(tag: number, data: DetailsFlight, pbf: Pbf) {
  if (tag === 1) data.flight = pbf.readString();
}

function readDetailsUpdateMessage(tag: number, data: DetailsMessage, pbf: Pbf) {
  if (tag === 1) data.more = pbf.readMessage<DetailsMore>(readDetailsMore, {});
  if (tag === 2)
    data.flight = pbf.readMessage<DetailsFlight>(readDetailsFlight, {});
  if (tag === 4)
    data.current = pbf.readMessage<DetailsCurrent>(readDetailsCurrent, {});
  if (tag === 6) {
    if (data.positions === undefined) data.positions = [];
    data.positions.push(
      pbf.readMessage<DetailsPositions>(readDetailsPosition, {})
    );
  }
}

function readFollowUpdateMessage(tag: number, data: DetailsMessage, pbf: Pbf) {
  if (tag === 1) data.more = pbf.readMessage<DetailsMore>(readDetailsMore, {});
  if (tag === 3)
    data.flight = pbf.readMessage<DetailsFlight>(readDetailsFlight, {});
  if (tag === 5)
    data.current = pbf.readMessage<DetailsCurrent>(readDetailsCurrent, {});
  if (tag === 6) {
    if (data.positions === undefined) data.positions = [];
    data.positions.push(
      pbf.readMessage<DetailsPositions>(readDetailsPosition, {})
    );
  }
}

export const handleLiveUpdate = (msg: string) => {
  const dataFrames: DataFrame[] = [];
  const positionFrames: PositionFrame[] = [];
  const buffer = base64ToArrayBuffer(msg);

  try {
    const updates = new Pbf(buffer.slice(5, -15)).readFields<FlightUpdate[]>(
      readLiveUpdateMessage,
      []
    );

    for (let i = 0; i < updates.length; i++) {
      const u = updates[i];

      positionFrames.push({
        ts: u.ts!,
        id: u.id!,
        lat: u.lat!,
        lon: u.lon!,
        callsign: u.callsign!,
        alt: u.alt!,
        speed: u.speed,
        heading: u.track,
        source: "live",
      });

      if (u.details)
        dataFrames.push({
          ts: u.ts!,
          id: u.id!,
          hex: u.details?.hex,
          squawk: u.details?.squawk,
          flight: u.details?.flight,
          reg: u.details?.reg,
          type: null,
          source: "live",
        });
    }
  } catch {
    console.log("live parse error", msg);
  }

  storeDataFrames(dataFrames);
  storePositionFrames(positionFrames);
};

export const handlePlaybackUpdate = (msg: string) => {
  const dataFrames: DataFrame[] = [];
  const positionFrames: PositionFrame[] = [];

  const buffer = base64ToArrayBuffer(msg);

  try {
    const updates = new Pbf(buffer.slice(5, -15)).readFields<PlaybackMessage>(
      readPlaybackUpdateMessage,
      {}
    );

    if (updates.updates)
      for (let i = 0; i < updates.updates.length; i++) {
        const u = updates.updates[i];

        positionFrames.push({
          ts: u.ts!,
          id: u.id!,
          lat: u.lat!,
          lon: u.lon!,
          callsign: u.callsign!,
          alt: u.alt!,
          speed: u.speed,
          heading: u.track,
          source: "playback",
        });

        if (u.details)
          dataFrames.push({
            ts: u.ts!,
            id: u.id!,
            hex: u.details?.hex,
            squawk: u.details?.squawk,
            flight: u.details?.flight,
            reg: u.details?.reg,
            type: null,
            source: "playback",
          });
      }
  } catch {
    console.log("playback parse error", msg);
    return;
  }

  storeDataFrames(dataFrames);
  storePositionFrames(positionFrames);
};

export const handleDetailsUpdate = (msg: string) => {
  const dataFrames: DataFrame[] = [];
  const positionFrames: PositionFrame[] = [];

  const buffer = base64ToArrayBuffer(msg);

  try {
    const details = new Pbf(buffer.slice(5, -15)).readFields<DetailsMessage>(
      readDetailsUpdateMessage,
      {}
    );

    if (!details.current) return;

    dataFrames.push({
      ts: details.current.ts!,
      id: details.current.id!,
      hex: details.more?.hex,
      squawk: details.current.squawk,
      flight: details.flight?.flight,
      reg: details.more?.reg,
      type: details.more?.type,
      source: "details",
    });

    positionFrames.push({
      ts: details.current.ts!,
      id: details.current.id!,
      lat: details.current.lat!,
      lon: details.current.lon!,
      callsign: details.current.callsign!,
      alt: details.current.alt!,
      speed: details.current.speed,
      heading: details.current.track,
      source: "details",
    });

    if (details.positions)
      for (let i = 0; i < details.positions.length; i++) {
        const u = details.positions[i];

        positionFrames.push({
          ts: u.ts!,
          id: details.current.id!,
          lat: u.lat!,
          lon: u.lon!,
          callsign: details.current.callsign!,
          alt: u.alt!,
          speed: u.speed,
          heading: u.track,
          source: "details",
        });
      }
  } catch {
    console.log("details parse error", msg);
    return;
  }

  storeDataFrames(dataFrames);
  storePositionFrames(positionFrames);
};

export const handleFollowUpdate = (msg: string) => {
  const dataFrames: DataFrame[] = [];
  const positionFrames: PositionFrame[] = [];

  let buffer: ArrayBuffer;
  try {
    buffer = base64ToArrayBuffer(msg);
  } catch {
    // follow update not fully loaded yet
    return;
  }

  try {
    const details = new Pbf(buffer.slice(5)).readFields<DetailsMessage>(
      readFollowUpdateMessage,
      {}
    ); 

    if (!details.current) return;

    dataFrames.push({
      ts: details.current.ts!,
      id: details.current.id!,
      hex: details.more?.hex,
      squawk: details.current.squawk,
      flight: details.flight?.flight,
      reg: details.more?.reg,
      type: details.more?.type,
      source: "follow",
    });

    positionFrames.push({
      ts: details.current.ts!,
      id: details.current.id!,
      lat: details.current.lat!,
      lon: details.current.lon!,
      callsign: details.current.callsign!,
      alt: details.current.alt!,
      speed: details.current.speed,
      heading: details.current.track,
      source: "follow",
    });

    if (details.positions)
      for (let i = 0; i < details.positions.length; i++) {
        const u = details.positions[i];

        positionFrames.push({
          ts: u.ts!,
          id: details.current.id!,
          lat: u.lat!,
          lon: u.lon!,
          callsign: details.current.callsign!,
          alt: u.alt!,
          speed: u.speed,
          heading: u.track,
          source: "follow",
        });
      }
  } catch (e) {
    console.log("follow parse error", e, msg);
    return;
  }

  storeDataFrames(dataFrames);
  storePositionFrames(positionFrames);
};
