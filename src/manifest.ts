export default {
  manifest_version: 3,
  name: "Your Extension Name",
  version: "1.0.0",
  description: "A brief description of your Chrome extension.",
  icons: {
    "16": "assets/logo.svg",
    "48": "assets/logo.svg",
    "128": "assets/logo.svg"
  },
  action: {
    default_popup: "popup/index.html",
    default_icon: "assets/logo.svg"
  },
  background: {
    service_worker: "background/index.ts"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["content-script/index.ts"]
    }
  ],
  permissions: [
    "activeTab",
    "storage"
  ],
  web_accessible_resources: [
    {
      resources: ["assets/logo.svg"],
      matches: ["<all_urls>"]
    }
  ]
};