// inject a minimal hook for XHR and fetch requests
// and pass them through the isolation bridge to the backend
(function () {
  function _arrayBufferToBase64(buffer) {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const playbackHandler = (response) => {
    window.postMessage({
      type: "playback",
      data: _arrayBufferToBase64(response),
    });
  };

  const liveHandler = (response) => {
    window.postMessage({
      type: "live",
      data: _arrayBufferToBase64(response),
    });
  };

  const detailsHandler = (response) => {
    window.postMessage({
      type: "details",
      data:  _arrayBufferToBase64(response)
    });
  };

  const handlers = {
    "fr24.feed.api.v1.Feed/Playback":
      playbackHandler,
    "fr24.feed.api.v1.Feed/LiveFeed":
      liveHandler,
    "fr24.feed.api.v1.Feed/FlightDetails":
      detailsHandler,
  };

  const originalXhr = window.XMLHttpRequest.prototype.open;

  window.XMLHttpRequest.prototype.open = function () {
    this.addEventListener("load", function () {
      for (const [prefix, handler] of Object.entries(handlers)) {
        if (this.responseURL.endsWith(prefix)) {
          handler(this.response);
          break;
        }
      }
    });
    return originalXhr.apply(this, arguments);
  };
})();
