/**
 * Handle POST requests from the Chrome extension
 * @param {Object} e - Event object from the web request
 * @return {Object} Response containing the URL to the created spreadsheet
 */
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    const tableData = data.tableData;
    
    // Create a new spreadsheet with current timestamp
    const spreadsheet = SpreadsheetApp.create('Table Import ' + new Date().toISOString());
    const sheet = spreadsheet.getActiveSheet();
    
    // Write the data to the spreadsheet
    tableData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        sheet.getRange(rowIndex + 1, colIndex + 1).setValue(cell);
      });
    });
    
    // Auto-resize columns to fit the content
    for (let i = 1; i <= tableData[0].length; i++) {
      sheet.autoResizeColumn(i);
    }
    
    // Format the header row bold
    if (tableData.length > 0) {
      const headerRange = sheet.getRange(1, 1, 1, tableData[0].length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f3f3f3');
    }
    
    // Add borders to the table
    const tableRange = sheet.getRange(1, 1, tableData.length, tableData[0].length);
    tableRange.setBorder(true, true, true, true, true, true);
    
    // Return the URL of the new spreadsheet
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      spreadsheetUrl: spreadsheet.getUrl(),
      message: "Table data imported successfully!"
    })).setMimeType(ContentService.MimeType.JSON);
  } 
  catch (error) {
    // Log the error and return an error message
    console.error('Error creating spreadsheet:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: "Failed to import table data."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}