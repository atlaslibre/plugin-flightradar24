import { setupOffscreenDocument } from "./db/offscreen-setup";
import { executeQuery } from "./features/db-interface";
import { handleDetailsUpdate, handleLiveUpdate, handlePlaybackUpdate } from "./features/update";
import { locate } from "./features/locate";
import {
  generatePositionQuery,
  PositionQueryRow,
  transformToActor,
} from "./features/query";
import {} from "./features/update";
import {
  generateTrackQuery,
  TrackQueryRow,
  transformToTrack,
} from "./features/track";
import { updateIcon } from "./shared/utilities";

await setupOffscreenDocument("offscreen.html");

let captureActive = true;

chrome.runtime.onMessageExternal.addListener(function (
  msg,
  _sender,
  sendResponse
) {
  if (msg.type === "locate") locate(msg.center[1], msg.center[0], msg.zoom);

  if (msg.type === "status") {
    if (!captureActive) {
      sendResponse("Capture disabled");
      return;
    }

    executeQuery<any[]>(
      "SELECT COUNT(DISTINCT id) as c FROM aircraft_positions"
    ).then((r) => {
      sendResponse(`${r[0].c} aircraft discovered`);
    });
  }

  if (msg.type === "query") {
    executeQuery<PositionQueryRow[]>(
      generatePositionQuery(
        msg.ts,
        msg.maxDelta,
        msg.bounds[0][1],
        msg.bounds[1][1],
        msg.bounds[0][0],
        msg.bounds[1][0],
        msg.limit
      )
    ).then((positionResult) => {
      if (msg.tracks === undefined) msg.tracks = [];

      const ids = msg.tracks.map((s: string): string => s.split("-")[1]);

      const trackPromise =
        ids.length > 0
          ? executeQuery<TrackQueryRow[]>(
              generateTrackQuery(ids, msg.ts, msg.maxDeltaTrack ?? msg.maxDelta)
            )
          : Promise.resolve([]);

      trackPromise.then((trackResult) => {
        const tracks = [];
        for (let i = 0; i < msg.tracks.length; i++) {
          const id = parseInt(msg.tracks[i].split("-")[1] as string, 16);
          const tracksForIds = trackResult.filter((a) => a.id == id);
          if (tracksForIds.length > 0) {
            tracks.push(transformToTrack(tracksForIds));
          }
        }
        sendResponse({
          version: 1,
          actors: positionResult.map((a) => transformToActor(a)),
          tracks: tracks,
        });
      });
    });
  }
});

chrome.runtime.onMessage.addListener(function (msg) {
  if (msg.target !== "background" || !msg.type) return;
  if (!captureActive) return;

  if (msg.type === "live") {
    handleLiveUpdate(msg.data);
  } else if (msg.type === "playback") {
    handlePlaybackUpdate(msg.data);
  } else if (msg.type === "details") {
    handleDetailsUpdate(msg.data);
  }
});

chrome.action.onClicked.addListener(() => {
  captureActive = !captureActive;
  updateIcon(captureActive);
});

updateIcon(captureActive);
