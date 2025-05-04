/**
 * Popup script for the extension configuration
 * Handles saving and loading of the Google Sheets script URL
 */

// DOM Elements
const scriptUrlInput = document.getElementById('scriptUrl') as HTMLInputElement;
const saveButton = document.getElementById('saveButton') as HTMLButtonElement;
const setupLink = document.getElementById('setupLink') as HTMLAnchorElement;
const versionText = document.getElementById('versionText') as HTMLSpanElement;

/**
 * Save the script URL to Chrome storage
 */
function saveSettings(): void {
  const scriptUrl = scriptUrlInput.value.trim();
  
  if (!scriptUrl) {
    showFeedback('Please enter a valid script URL', true);
    return;
  }
  
  // Simple URL validation
  if (!scriptUrl.startsWith('https://')) {
    showFeedback('URL must start with https://', true);
    return;
  }
  
  // Save to Chrome storage
  chrome.storage.sync.set({ 
    sheetsScriptUrl: scriptUrl 
  }, () => {
    showFeedback('Settings saved successfully!');
  });
}

/**
 * Load saved settings from Chrome storage
 */
function loadSettings(): void {
  chrome.storage.sync.get(['sheetsScriptUrl'], (result) => {
    if (result.sheetsScriptUrl) {
      scriptUrlInput.value = result.sheetsScriptUrl;
    }
  });
  
  // Display extension version from manifest
  const version = chrome.runtime.getManifest().version;
  versionText.textContent = version;
}

/**
 * Show feedback message to the user
 * @param message - Message to display
 * @param isError - Whether this is an error message
 */
function showFeedback(message: string, isError = false): void {
  // Check if there's already a feedback element
  let feedbackEl = document.querySelector('.feedback');
  
  // If not, create one
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.className = 'feedback';
    const content = document.querySelector('.content');
    content?.insertBefore(feedbackEl, content.firstChild);
  }
  
  // Set message and styling
  feedbackEl.textContent = message;
  feedbackEl.classList.toggle('error', isError);
  
  // Remove after 3 seconds
  setTimeout(() => {
    feedbackEl.remove();
  }, 3000);
}

/**
 * Open setup instructions in a new tab
 */
function openSetupInstructions(): void {
  const setupInstructionsUrl = 'https://github.com/yourusername/chrome-extension-auto-publisher#google-apps-script-setup';
  chrome.tabs.create({ url: setupInstructionsUrl });
}

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);

// Event listeners
saveButton.addEventListener('click', saveSettings);
setupLink.addEventListener('click', (e) => {
  e.preventDefault();
  openSetupInstructions();
});

// Check if we were opened from the "setup required" flow
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('setup') === 'true') {
  showFeedback('Please set up your Google Apps Script URL to continue', false);
}