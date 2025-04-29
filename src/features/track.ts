import { ActorPosition, ActorTrack } from "../shared/types";

export interface TrackQueryRow {
  ts: number;
  id: number;
  lat: number;
  lon: number;
  alt?: number;
  heading?: number;
  speed?: number;
  delta: number;
}

export function transformToTrack(rows: TrackQueryRow[]): ActorTrack {
  const pos = rows.map(
    (row): ActorPosition => ({
      ts: row.ts,
      lat: row.lat,
      lon: row.lon,
      alt: row.alt !== undefined && row.alt < 0 ? 0 : row.alt, // todo convert ft
      heading: row.heading,
      speed: row.speed, // todo convert knots
    })
  );

  return {
    id: `fr24-${rows[0].id.toString(16)}`,
    track: pos,
  };
}

export function generateTrackQuery(ids: string[], ts: number, delta: number) {
  const idsPart =
    ids.length > 0
      ? `AND id IN (${ids.map((id) => `'${parseInt(id, 16)}'`).join(",")})`
      : "";

  return `SELECT
    ts,
    id,
    lat,
    lon,
    alt,
    heading,
    speed,
    abs(${ts} - CAST(ts AS REAL)) as delta
FROM
    aircraft_positions
WHERE
    delta < ${delta}
    ${idsPart}
ORDER BY
    ts`;
}
