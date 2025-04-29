let creating: any; // A global promise to avoid concurrency issues

export async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  //@ts-ignore

  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    //@ts-ignore
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ["WORKERS"],
      justification: "Running the DuckDB-WASM instance",
    });
    await creating;
    creating = null;
  }
}