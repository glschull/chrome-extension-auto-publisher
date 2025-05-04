/**
 * Background script for the Chrome Extension
 * Handles context menu creation and communication with content scripts
 */

// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed');
  
  // Create a context menu item that appears when right-clicking on tables
  chrome.contextMenus.create({
    id: 'copyTableToSheets',
    title: 'Copy Table to Google Sheets',
    contexts: ['all'], // We'll filter for tables in the content script
  }, () => {
    // Check if there was an error creating the context menu
    if (chrome.runtime.lastError) {
      console.error('[Background] Error creating context menu:', chrome.runtime.lastError);
    } else {
      console.log('[Background] Context menu created successfully');
    }
  });
});

/**
 * Handle context menu clicks
 * @param info - Information about the context menu click
 * @param tab - Information about the current tab
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('[Background] Context menu clicked:', info.menuItemId);
  
  if (info.menuItemId === 'copyTableToSheets' && tab?.id) {
    console.log('[Background] Sending extractTable message to tab:', tab.id);
    
    // Send message to content script to extract the table data
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractTable'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error sending message to content script:', chrome.runtime.lastError);
      } else {
        console.log('[Background] Content script response:', response);
      }
    });
  }
});

/**
 * Listen for messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received from content script:', message);
  
  if (message.action === 'openGoogleSheets' && message.tableData) {
    console.log('[Background] Table data received, rows:', message.tableData.length);
    
    // Retrieve the Google Sheets script URL from storage
    chrome.storage.sync.get(['sheetsScriptUrl'], (result) => {
      const scriptUrl = result.sheetsScriptUrl;
      console.log('[Background] Retrieved script URL:', scriptUrl);
      
      if (!scriptUrl) {
        // If no script URL is set, let the user know they need to set it
        console.log('[Background] No script URL found, opening setup page');
        chrome.tabs.create({
          url: chrome.runtime.getURL('popup/index.html?setup=true')
        });
        return;
      }
      
      console.log('[Background] Sending data to Google Apps Script:', scriptUrl);
      
      // Send the table data to the user's Apps Script web app
      fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tableData: message.tableData
        })
      })
      .then(response => {
        console.log('[Background] Response from Apps Script:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('[Background] Data from Apps Script:', data);
        // Open the created spreadsheet in a new tab
        if (data.spreadsheetUrl) {
          chrome.tabs.create({ url: data.spreadsheetUrl });
        }
      })
      .catch(error => {
        console.error('[Background] Error creating spreadsheet:', error);
        // Inform the user of the error
        if (sender.tab && sender.tab.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'showError',
            error: 'Failed to create spreadsheet. Please check your Apps Script URL.'
          });
        }
      });
    });
    
    // Let the content script know we received the message
    console.log('[Background] Sending acknowledgment to content script');
    sendResponse({ status: 'processing' });
    return true; // Keep the message channel open for async response
  }
});