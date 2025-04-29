import { AsyncDuckDB, DuckDBAccessMode } from "@duckdb/duckdb-wasm";

export const DataFrameCreateCommand = `
    CREATE TABLE IF NOT EXISTS aircraft_data (
        ts UBIGINT NOT NULL, 
        id UBIGINT NOT NULL,
        hex VARCHAR,
        squawk VARCHAR,
        flight VARCHAR,
        reg VARCHAR,
        type VARCHAR,
        source VARCHAR,
        PRIMARY KEY (ts, id)
    );`;

export const PositionFrameCreateCommand = `
    CREATE TABLE IF NOT EXISTS aircraft_positions (
        ts UBIGINT NOT NULL, 
        id UBIGINT NOT NULL,
        lat FLOAT NOT NULL,
        lon FLOAT NOT NULL,
        callsign VARCHAR,
        alt FLOAT,
        speed INT,
        heading INT,
        source VARCHAR,
        PRIMARY KEY (ts, id)
    );`;

export const initDb = async (db: AsyncDuckDB) => {
  const conn = await db.connect();
  await conn.query(DataFrameCreateCommand);
  await conn.query(PositionFrameCreateCommand);
  await conn.close();
};
