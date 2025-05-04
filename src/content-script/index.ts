/**
 * Content script for interacting with web pages
 * Extracts HTML table data when triggered by context menu
 */
console.log('[Content] Content script loaded');

// Variable to track the element that was right-clicked
let targetElement: HTMLElement | null = null;

// Listen for mousedown to capture the target element
document.addEventListener('mousedown', (event) => {
  if (event.button === 2) { // Right click
    targetElement = event.target as HTMLElement;
    console.log('[Content] Right-click detected, target element:', targetElement.tagName);
  }
});

/**
 * Convert an HTML table to a 2D array of strings
 * @param table - The HTML table element to extract data from
 * @returns A 2D array representing the table data
 */
function extractTableData(table: HTMLTableElement): string[][] {
  console.log('[Content] Extracting data from table with rows:', table.rows.length);
  const rows = Array.from(table.rows);
  
  return rows.map(row => {
    const cells = Array.from(row.cells);
    return cells.map(cell => cell.textContent?.trim() || '');
  });
}

/**
 * Find the closest table element from a given node
 * @param node - Starting node to search from
 * @returns The closest table element or null if none found
 */
function findClosestTable(node: Node | null): HTMLTableElement | null {
  if (!node) {
    console.log('[Content] Node is null, no table found');
    return null;
  }
  
  // If the node is a table, return it
  if (node instanceof HTMLTableElement) {
    console.log('[Content] Node is a table, found directly');
    return node;
  }
  
  // If the node is an element, check if it contains a table
  if (node instanceof HTMLElement) {
    console.log('[Content] Checking if element contains a table:', node.tagName);
    const table = node.querySelector('table');
    if (table) {
      console.log('[Content] Found table within element');
      return table as HTMLTableElement;
    }
    
    // Check if parent contains a table
    console.log('[Content] No table found in element, checking parent');
    return findClosestTable(node.parentNode);
  }
  
  // Check parent node
  console.log('[Content] Node is not an element, checking parent');
  return findClosestTable(node.parentNode);
}

/**
 * Convert table data to TSV (Tab Separated Values) format
 * @param tableData - 2D array of table data
 * @returns TSV string representation
 */
function convertToTSV(tableData: string[][]): string {
  return tableData.map(row => row.join('\t')).join('\n');
}

/**
 * Show a notification to the user
 * @param message - Message to display
 * @param isError - Whether this is an error notification
 */
function showNotification(message: string, isError = false): void {
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
    document.body.removeChild(notification);
  }, 3000);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content] Message received from background:', message);
  
  if (message.action === 'extractTable') {
    console.log('[Content] Extract table action received, target element:', targetElement?.tagName);
    
    // Find the closest table to the right-clicked element
    const table = findClosestTable(targetElement);
    
    if (!table) {
      console.log('[Content] No table found');
      showNotification('No table found near the clicked element', true);
      sendResponse({ status: 'error', message: 'No table found' });
      return;
    }
    
    try {
      // Extract table data
      console.log('[Content] Table found, extracting data');
      const tableData = extractTableData(table);
      console.log('[Content] Table data extracted, rows:', tableData.length);
      
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
      showNotification('Error extracting table data', true);
      sendResponse({ status: 'error', message: error.toString() });
    }
    
    return true; // Keep the message channel open for async response
  } else if (message.action === 'showError') {
    showNotification(message.error, true);
    sendResponse({ status: 'acknowledged' });
  }
  
  return true; // Keep the message channel open for async response
});