import { createApp } from "vue";

import App from "./App.vue";

console.log("APP_VERSION:", __APP_VERSION__);

createApp(App).mount("#app");
