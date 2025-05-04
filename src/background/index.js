"use strict";
/**
 * Background script for the Chrome Extension
 * Handles context menu creation and communication with content scripts
 * Updated to trigger GitHub Actions workflow
 */

// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed');
  
  // Create a context menu item that appears when right-clicking on tables
  chrome.contextMenus.create({
    id: 'copyTableToSheets',
    title: 'Copy Table to Google Sheets',
    contexts: ['all'] // We'll filter for tables in the content script
  }, () => {
    // Check if there was an error creating the context menu
    if (chrome.runtime.lastError) {
      console.error('[Background] Error creating context menu:', chrome.runtime.lastError);
    } else {
      console.log('[Background] Context menu created successfully');
    }
  });
  
  // Check if script URL is saved
  chrome.storage.sync.get(['sheetsScriptUrl'], (result) => {
    console.log('[Background] On install, current saved script URL:', result.sheetsScriptUrl || 'not set');
  });
});

/**
 * Inject content script into the current tab
 * @param {number} tabId - ID of the tab to inject into
 * @returns {Promise} - Resolves when script is injected
 */
function injectContentScriptIntoTab(tabId) {
  return new Promise((resolve, reject) => {
    console.log('[Background] Injecting content script into tab:', tabId);
    
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Failed to inject content script:', chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError);
      } else {
        console.log('[Background] Content script injected successfully');
        resolve(results);
      }
    });
  });
}

/**
 * Send a message to a tab with retry on failure
 * @param {number} tabId - ID of the tab to message
 * @param {object} message - Message to send
 * @returns {Promise} - Resolves with the response
 */
function sendMessageToTabWithRetry(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Background] Initial message send failed:', chrome.runtime.lastError.message);
        
        // Attempt to inject content script
        injectContentScriptIntoTab(tabId)
          .then(() => {
            // Wait for script to initialize
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, message, (retryResponse) => {
                if (chrome.runtime.lastError) {
                  console.error('[Background] Retry failed:', chrome.runtime.lastError.message);
                  reject(chrome.runtime.lastError);
                } else {
                  console.log('[Background] Retry succeeded, response:', retryResponse);
                  resolve(retryResponse);
                }
              });
            }, 300);
          })
          .catch(reject);
      } else {
        console.log('[Background] Message sent successfully, response:', response);
        resolve(response);
      }
    });
  });
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('[Background] Context menu clicked:', info.menuItemId);
  
  if (info.menuItemId === 'copyTableToSheets' && tab?.id) {
    console.log('[Background] Handling copyTableToSheets for tab:', tab.id);
    
    sendMessageToTabWithRetry(tab.id, { action: 'extractTable' })
      .catch(error => {
        console.error('[Background] Failed to communicate with content script after retries:', error);
        // Show an error notification directly in the page
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: (errorMsg) => {
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '10px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.padding = '10px 20px';
            notification.style.backgroundColor = '#f44336';
            notification.style.color = 'white';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '10000';
            notification.style.fontFamily = 'Arial, sans-serif';
            notification.textContent = errorMsg;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
          },
          args: ['Error: Could not extract table. Please reload the page and try again.']
        });
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
      console.log('[Background] Retrieved script URL:', scriptUrl || 'not set');
      
      if (!scriptUrl) {
        // If no script URL is set, let the user know they need to set it
        console.log('[Background] No script URL found, opening setup page');
        chrome.tabs.create({
          url: chrome.runtime.getURL('popup/index.html?setup=true')
        });
        return;
      }
      
      console.log('[Background] Sending data to Google Apps Script:', scriptUrl);
      
      // Log the data being sent
      console.log('[Background] Table data sample (first row):', message.tableData[0]);
      
      // Send the table data to the user's Apps Script web app
      fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          tableData: message.tableData
        })
      })
      .then(response => {
        console.log('[Background] Response status from Apps Script:', response.status);
        console.log('[Background] Response headers:', Object.fromEntries([...response.headers]));
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        return response.text().then(text => {
          console.log('[Background] Raw response body:', text);
          
          // Check if the response starts with HTML
          if (text.trim().startsWith('<')) {
            throw new Error('Server returned HTML instead of JSON. Check your Apps Script deployment.');
          }
          
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error('[Background] Error parsing JSON response:', e);
            throw new Error(`Invalid JSON response from server: ${text.substring(0, 50)}...`);
          }
        });
      })
      .then(data => {
        console.log('[Background] Parsed data from Apps Script:', data);
        
        if (!data) {
          throw new Error('Empty response from server');
        }
        
        // Open the created spreadsheet in a new tab
        if (data.spreadsheetUrl) {
          console.log('[Background] Opening spreadsheet URL:', data.spreadsheetUrl);
          chrome.tabs.create({ url: data.spreadsheetUrl });
        } else {
          console.error('[Background] Missing spreadsheetUrl in response');
          throw new Error(`Missing spreadsheetUrl in response: ${JSON.stringify(data)}`);
        }
      })
      .catch(error => {
        console.error('[Background] Error creating spreadsheet:', error);
        
        // Inform the user of the error with more detail
        if (sender.tab && sender.tab.id) {
          let errorMessage = 'Failed to create spreadsheet. Please check your Apps Script URL.';
          
          if (error.message.includes('HTML')) {
            errorMessage = 'Your Apps Script needs to be properly deployed as a web app. Check the setup instructions.';
          } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error when connecting to Google Apps Script. Check your URL and internet connection.';
          }
          
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'showError',
            error: errorMessage
          }).catch(() => {
            // If we can't message the tab, show the error directly
            chrome.scripting.executeScript({
              target: { tabId: sender.tab.id },
              function: (msg) => {
                const notification = document.createElement('div');
                notification.style.position = 'fixed';
                notification.style.top = '10px';
                notification.style.left = '50%';
                notification.style.transform = 'translateX(-50%)';
                notification.style.padding = '10px 20px';
                notification.style.backgroundColor = '#f44336';
                notification.style.color = 'white';
                notification.style.borderRadius = '5px';
                notification.style.zIndex = '10000';
                notification.style.fontFamily = 'Arial, sans-serif';
                notification.textContent = msg;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 5000);
              },
              args: [errorMessage]
            });
          });
        }
      });
    });
    
    // Let the content script know we received the message
    console.log('[Background] Sending acknowledgment to content script');
    sendResponse({ status: 'processing' });
    return true; // Keep the message channel open for async response
  }
  
  return true; // Keep the message channel open for async response
});
