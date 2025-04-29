import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { randToken } from "../shared/utilities";

export const bulkInsert = async <T>(
  db: AsyncDuckDB,
  table: string,
  rows: T[]
) => {
  const now = Date.now();
  const filename = `import-${randToken()}.json`;

  await db.registerFileText(filename, JSON.stringify(rows));

  const conn = await db.connect();

  await conn.query(
    `INSERT OR IGNORE INTO '${table}' SELECT * FROM read_json('${filename}');`
  );

  await conn.close();
  await db.dropFile(filename);

  const timing = Date.now() - now;
  console.debug(
    `bulk insert complete for table ${table} in ${timing} ms (${rows.length} records)`
  );
};

export const runQuery = async (db: AsyncDuckDB, query: string) => {
  const now = Date.now();

  console.debug(
    `query starting '${query}'`
  );

  const conn = await db.connect();
  const result = await conn.query(query);
  const returnValue = result.toArray().map((row) => row.toJSON());
  
  const safeReturnValue = JSON.parse(
    JSON.stringify(returnValue, (key, value) => {
      if (typeof value === "bigint")
        //@ts-ignore
        return JSON.rawJSON(value.toString());

      return value;
    })
  );
    
  const timing = Date.now() - now;
  
  console.debug(
    `query complete in ${timing} ms (${returnValue.length} records)`
  );

  return safeReturnValue;
};
