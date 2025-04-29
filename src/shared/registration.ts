import { PluginDescriptor } from "./types";

export function registerPlugin(descriptor: PluginDescriptor) {
  document.documentElement.setAttribute(
    "data-albp-" + chrome.runtime.id,
    JSON.stringify(descriptor)
  );
}
