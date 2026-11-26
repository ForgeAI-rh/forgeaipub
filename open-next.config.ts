import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every app page is rendered per request, so no incremental cache is needed.
export default defineCloudflareConfig({});
