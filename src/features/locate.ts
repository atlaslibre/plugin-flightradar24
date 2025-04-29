export const locate = (lat: number, lon: number, zoom: number) => {
  chrome.tabs.create({
    url: `https://www.flightradar24.com/${lat.toFixed(2)},${lon.toFixed(2)}/${Math.trunc(zoom)}`,
  });
};