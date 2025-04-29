import { bulkInsert, runQuery } from "./db/commands";
import { getDbInstance } from "./db/duckdb-setup";
import { initDb } from "./db/migrations";
import { DbInterfaceMessage } from "./features/types";

const db = await getDbInstance();
const version = await db.getVersion();

//@ts-ignore
window.db = db;

console.log(`DuckDB ready version: ${version}`);

await initDb(db);

chrome.runtime.onMessage.addListener(
  (msg: DbInterfaceMessage, _sender, sendResponse) => {
    if (msg.target !== "db") return;

    (async () => {
      if (msg.type === "store-data-frames") {
        await bulkInsert(db, "aircraft_data", msg.frames);
        return;
      }

      if (msg.type === "store-position-frames") {
        await bulkInsert(db, "aircraft_positions", msg.frames);
        return;
      }

      if (msg.type === "query") {
        const response = await runQuery(db, msg.query);
        sendResponse(response);
      }
    })();

    return !msg.type.startsWith("store-");
  }
);
