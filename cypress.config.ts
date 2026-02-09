import { defineConfig } from "cypress";

export default defineConfig({
//   retries: {
//   runMode: 3,
//   openMode: 1
// },
  e2e: {
    baseUrl : "https://www.stuller.com",
    "watchForFileChanges": false,  //THIS STOPS AUTO RELOAD

    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
