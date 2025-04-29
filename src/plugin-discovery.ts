import { registerPlugin } from "./shared/registration";

registerPlugin({
  type: "actor",
  name: "Flightradar24",
  attribution: "Aircraft data by Flightradar24.com",
  replay: true,
  locate: true,
  status: true
})
