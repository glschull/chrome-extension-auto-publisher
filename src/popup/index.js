"use strict";
/**
 * Popup script for the extension configuration
 * Handles saving and loading of the Google Sheets script URL
 */

// Initialize console logging
console.log('[Popup] Script loaded');

// DOM Elements - Initialize after DOM is loaded
let scriptUrlInput;
let saveButton;
let setupLink;
let versionText;

/**
 * Save the script URL to Chrome storage
 */
function saveSettings() {
  const scriptUrl = scriptUrlInput.value.trim();
  console.log('[Popup] Attempting to save script URL:', scriptUrl);
  
  if (!scriptUrl) {
    console.warn('[Popup] Empty URL provided');
    showFeedback('Please enter a valid script URL', true);
    return;
  }
  
  // Simple URL validation
  if (!scriptUrl.startsWith('https://')) {
    console.warn('[Popup] URL doesn\'t start with https://');
    showFeedback('URL must start with https://', true);
    return;
  }
  
  // Log URL for debugging
  console.log('[Popup] URL validation passed, saving to storage:', scriptUrl);
  
  // Save to Chrome storage
  chrome.storage.sync.set({ 
    sheetsScriptUrl: scriptUrl 
  }, () => {
    // Check for errors
    if (chrome.runtime.lastError) {
      console.error('[Popup] Error saving to storage:', chrome.runtime.lastError);
      showFeedback('Error saving settings: ' + chrome.runtime.lastError.message, true);
      return;
    }
    
    console.log('[Popup] Settings saved successfully');
    
    // Verify the save by reading it back
    chrome.storage.sync.get(['sheetsScriptUrl'], (result) => {
      console.log('[Popup] Verified saved URL:', result.sheetsScriptUrl);
      showFeedback('Settings saved successfully!');
    });
  });
}

/**
 * Load saved settings from Chrome storage
 */
function loadSettings() {
  console.log('[Popup] Loading settings');
  chrome.storage.sync.get(['sheetsScriptUrl'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('[Popup] Error loading from storage:', chrome.runtime.lastError);
      return;
    }
    
    if (result.sheetsScriptUrl) {
      console.log('[Popup] Found saved script URL:', result.sheetsScriptUrl);
      scriptUrlInput.value = result.sheetsScriptUrl;
    } else {
      console.log('[Popup] No saved script URL found');
    }
  });
  
  // Display extension version from manifest
  try {
    const version = chrome.runtime.getManifest().version;
    console.log('[Popup] Extension version:', version);
    versionText.textContent = version;
  } catch (error) {
    console.error('[Popup] Error getting extension version:', error);
  }
}

/**
 * Show feedback message to the user
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether this is an error message
 */
function showFeedback(message, isError = false) {
  console.log('[Popup] Showing feedback:', message, isError ? '(error)' : '');
  
  // Check if there's already a feedback element
  let feedbackEl = document.querySelector('.feedback');
  
  // If not, create one
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.className = 'feedback';
    const content = document.querySelector('.content');
    if (content) {
      content.insertBefore(feedbackEl, content.firstChild);
    } else {
      console.error('[Popup] Content element not found');
      document.body.insertBefore(feedbackEl, document.body.firstChild);
    }
  }
  
  // Set message and styling
  feedbackEl.textContent = message;
  feedbackEl.className = 'feedback' + (isError ? ' error' : '');
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (feedbackEl.parentNode) {
      feedbackEl.parentNode.removeChild(feedbackEl);
    }
  }, 3000);
}

/**
 * Open setup instructions in a new tab
 */
function openSetupInstructions(e) {
  e.preventDefault();
  const setupInstructionsUrl = 'https://github.com/yourusername/chrome-extension-auto-publisher#google-apps-script-setup';
  console.log('[Popup] Opening setup instructions');
  chrome.tabs.create({ url: setupInstructionsUrl });
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('[Popup] DOM loaded, initializing popup');
  
  // Get DOM elements
  scriptUrlInput = document.getElementById('scriptUrl');
  saveButton = document.getElementById('saveButton');
  setupLink = document.getElementById('setupLink');
  versionText = document.getElementById('versionText');
  
  if (!scriptUrlInput || !saveButton || !setupLink || !versionText) {
    console.error('[Popup] Failed to find required DOM elements:',
      !scriptUrlInput ? 'Missing scriptUrlInput' : '',
      !saveButton ? 'Missing saveButton' : '',
      !setupLink ? 'Missing setupLink' : '',
      !versionText ? 'Missing versionText' : ''
    );
    return;
  }
  
  console.log('[Popup] DOM elements found successfully');
  
  // Initialize event listeners
  saveButton.addEventListener('click', saveSettings);
  setupLink.addEventListener('click', openSetupInstructions);
  
  // Load saved settings
  loadSettings();
  
  // Check if we were opened from the "setup required" flow
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('setup') === 'true') {
    showFeedback('Please set up your Google Apps Script URL to continue', false);
  }
});
