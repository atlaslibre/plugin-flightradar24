import { bearing } from "../shared/utilities";
import { DataFrame, DbInterfaceMessage, PositionFrame } from "./types";

const dbRequest = (msg: DbInterfaceMessage) => {
  chrome.runtime.sendMessage(msg);
};

const dbRequestWithReponse = async <T>(msg: DbInterfaceMessage) => {
  return new Promise<T>((resolve, reject) => {
    let faulted = false;
    const timeoutTimer = setTimeout(() => {
      faulted = true;
      reject("timeout from db");
    }, 10_000);

    chrome.runtime.sendMessage(msg, (response) => {
      clearTimeout(timeoutTimer);
      if (!faulted) resolve(response as T);
    });
  });
};

export const storeDataFrames = (frames: DataFrame[]) => {
  dbRequest({
    type: "store-data-frames",
    target: "db",
    frames: frames,
  });
};

export const storePositionFrames = (frames: PositionFrame[]) => {
  dbRequest({
    type: "store-position-frames",
    target: "db",
    frames: frames,
  });
};

export const executeQuery = async <T>(query: string): Promise<T> => {
  return await dbRequestWithReponse<T>({
    type: "query",
    target: "db",
    query: query,
  });
};
