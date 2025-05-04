"use strict";
/**
 * Content script for interacting with web pages
 * Extracts HTML table data when triggered by context menu
 */
console.log('[Content] Content script loaded');

// Variable to track the element that was right-clicked
let targetElement = null;
let lastRightClickTime = 0;

// Listen for mousedown to capture the target element
document.addEventListener('mousedown', (event) => {
  if (event.button === 2) { // Right click
    targetElement = event.target;
    lastRightClickTime = Date.now();
    console.log('[Content] Right-click detected, target element:', targetElement.tagName);
  }
});

/**
 * Convert an HTML table to a 2D array of strings
 */
function extractTableData(table) {
  console.log('[Content] Extracting data from table with rows:', table.rows.length);
  const rows = Array.from(table.rows);
  
  return rows.map(row => {
    const cells = Array.from(row.cells);
    return cells.map(cell => {
      // Get the visible text, handling potential nested elements
      return cell.innerText.trim() || '';
    });
  });
}

/**
 * Find the closest table element from a given node
 */
function findClosestTable(node) {
  if (!node) {
    console.log('[Content] Node is null, no table found');
    return findAnyTableOnPage();
  }
  
  // If the node is a table, return it
  if (node instanceof HTMLTableElement) {
    console.log('[Content] Node is a table, found directly');
    return node;
  }
  
  // If the node is inside a table cell, find the parent table
  let current = node;
  while (current && !(current instanceof HTMLTableElement)) {
    if (current instanceof HTMLTableCellElement || 
        current instanceof HTMLTableRowElement) {
      const parentTable = current.closest('table');
      if (parentTable) {
        console.log('[Content] Found parent table via closest()');
        return parentTable;
      }
    }
    current = current.parentElement;
  }
  
  // If the node is an element, check if it contains a table
  if (node instanceof HTMLElement) {
    console.log('[Content] Checking if element contains a table:', node.tagName);
    
    // First try with the closest method
    const closestTable = node.closest('table');
    if (closestTable) {
      console.log('[Content] Found table using closest() method');
      return closestTable;
    }
    
    // Then try querySelector
    const table = node.querySelector('table');
    if (table) {
      console.log('[Content] Found table within element using querySelector');
      return table;
    }
    
    // Check if parent contains a table
    console.log('[Content] No table found in element, checking parent');
    const parentResult = findClosestTable(node.parentNode);
    if (parentResult) return parentResult;
  }
  
  // If we still haven't found a table, look for any table on the page
  return findAnyTableOnPage();
}

/**
 * Find any table on the page as a fallback
 */
function findAnyTableOnPage() {
  // If we couldn't find a table related to the click, just get the first table on the page
  const allTables = document.querySelectorAll('table');
  if (allTables.length > 0) {
    console.log('[Content] Found table on page as fallback, total tables:', allTables.length);
    return allTables[0];
  }
  
  console.log('[Content] No tables found on page');
  return null;
}

/**
 * Show a notification to the user
 */
function showNotification(message, isError = false) {
  console.log('[Content] Showing notification:', message, isError ? '(error)' : '');
  
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '10px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '10000';
  notification.style.fontSize = '14px';
  notification.style.fontFamily = 'Arial, sans-serif';
  notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  
  if (isError) {
    notification.style.backgroundColor = '#f44336';
    notification.style.color = 'white';
  } else {
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Announce that the content script is ready to receive messages
console.log('[Content] Registering message listener');

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content] Message received from background:', message);
  
  if (message.action === 'extractTable') {
    console.log('[Content] Extract table action received');
    
    // Only use targets that were right-clicked in the last 2 seconds
    // This helps avoid processing unrelated clicks
    const targetIsRecent = (Date.now() - lastRightClickTime) < 2000;
    const nodeToUse = targetIsRecent ? targetElement : null;
    
    // Find the closest table to the right-clicked element
    console.log('[Content] Looking for table near:', nodeToUse?.tagName || 'no recent target');
    const table = findClosestTable(nodeToUse);
    
    if (!table) {
      console.log('[Content] No table found');
      showNotification('No table found on the page', true);
      sendResponse({ status: 'error', message: 'No table found' });
      return true;
    }
    
    try {
      // Extract table data
      console.log('[Content] Table found, extracting data');
      const tableData = extractTableData(table);
      console.log('[Content] Table data extracted, rows:', tableData.length);
      
      if (tableData.length === 0) {
        console.log('[Content] Table is empty');
        showNotification('The selected table appears to be empty', true);
        sendResponse({ status: 'error', message: 'Empty table' });
        return true;
      }
      
      // Send the data to the background script
      console.log('[Content] Sending data to background script');
      chrome.runtime.sendMessage({
        action: 'openGoogleSheets',
        tableData: tableData
      }, response => {
        console.log('[Content] Background script response:', response);
      });
      
      showNotification('Table extracted successfully! Opening Google Sheets...');
      sendResponse({ status: 'success' });
    } catch (error) {
      console.error('[Content] Error extracting table data:', error);
      showNotification('Error extracting table data: ' + error.message, true);
      sendResponse({ status: 'error', message: error.toString() });
    }
    
    return true; // Keep the message channel open for async response
  } else if (message.action === 'showError') {
    showNotification(message.error, true);
    sendResponse({ status: 'acknowledged' });
    return true;
  } else if (message.action === 'ping') {
    // Simple ping to check if content script is loaded
    console.log('[Content] Received ping from background script');
    sendResponse({ status: 'alive' });
    return true;
  }
  
  // Default response
  sendResponse({ status: 'unknown_action' });
  return true; // Keep the message channel open for async response
});

// Send a ready message to the background script
try {
  chrome.runtime.sendMessage({ action: 'contentScriptReady' });
} catch (e) {
  console.error('[Content] Failed to send ready message:', e);
}
