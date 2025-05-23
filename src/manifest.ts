// Small update to trigger workflow - May 4, 2025
export default {
  manifest_version: 3,
  name: "Copy Table to Google Sheets",
  version: "1.0.0",
  description: "Easily copy HTML tables to Google Sheets with a right-click.",
  default_locale: "en",
  icons: {
    "16": "icons/16.png",
    "48": "icons/48.png",
    "128": "icons/128.png"
  },
  action: {
    default_popup: "popup.html",
    default_icon: "icons/48.png"
  },
  background: {
    service_worker: "background.js"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["content.js"],
      run_at: "document_end"
    }
  ],
  permissions: [
    "activeTab",
    "contextMenus",
    "storage",
    "scripting"
  ],
  host_permissions: [
    "<all_urls>"
  ]
};