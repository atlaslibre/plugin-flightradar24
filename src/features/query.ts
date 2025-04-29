import { ActorPosition } from "../shared/types";

export interface PositionQueryRow {
  id: number;
  lat: number;
  lon: number;
  callsign: string;
  alt?: number;
  heading?: number;
  speed?: number;
  flight?: string;
  hex?: string;
  reg?: string;
  squawk?: string;
  pts: number;
  dts: number;
  delta: number;
}

interface AircraftActor {
  type: "aircraft";
  id: string;
  name: string;
  pos: ActorPosition;
  hex?: string;
  reg?: string;
  flight?: string;
  squawk?: string;
}

export function transformToActor(row: PositionQueryRow): AircraftActor {
  
  row.flight = row.flight?.trim()

  if(row.flight === "")
    row.flight = undefined

  return {
    type: "aircraft",
    id: `fr24-${row.id.toString(16)}`,
    name: row.callsign ?? row.flight ?? row.reg ?? row.hex ?? row.id.toString(16),
    pos: {
      ts: row.pts,
      lat: row.lat,
      lon: row.lon,
      alt: row.alt !== undefined && row.alt < 0 ? 0 : row.alt, // todo convert ft
      heading: row.heading,
      speed: row.speed, // todo convert knots
    },
    hex: row.hex,
    reg: row.reg,
    flight: row.flight,
    squawk: row.squawk,
  };
}

export function generatePositionQuery(
  ts: number,
  delta: number,
  latmin: number,
  latmax: number,
  lonmin: number,
  lonmax: number,
  limit: number
) {
  return `SELECT
    DISTINCT ON (aircraft_positions.id) aircraft_positions.id,
    lat,
    lon,
    callsign,
    alt,
    heading,
    speed,
    hex,
    squawk,
    flight,
    reg,
    aircraft_positions.ts as pts,
    aircraft_data.ts as dts,
    abs(${ts} - CAST(aircraft_positions.ts AS REAL)) as delta
FROM
    aircraft_positions
    LEFT JOIN (
        SELECT
            DISTINCT ON (id) 
            ts,
            id,
            hex,
            squawk,
            flight,
            reg,
        FROM
            aircraft_data
        WHERE
            ts < ${ts}
        ORDER BY
            ts DESC
    ) as aircraft_data ON aircraft_positions.id = aircraft_data.id
WHERE
    delta < ${delta} AND
    lat > ${latmin-2} AND
    lat < ${latmax+2} AND
    lon > ${lonmin-2} AND
    lon < ${lonmax+2}
ORDER BY
    delta
LIMIT ${limit}`;
}
