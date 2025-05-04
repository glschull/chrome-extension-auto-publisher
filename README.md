# Chrome Extension Auto Publisher

A lean micro-Chrome extension boilerplate with TypeScript and Vite that includes a zero-touch CI/CD pipeline for automatic publishing to the Chrome Web Store.

This extension adds a "Copy Table to Google Sheets" context menu item when right-clicking on any HTML table, allowing you to quickly export table data to Google Sheets via an Apps Script web app.

![GitHub release workflow](https://img.shields.io/github/workflow/status/yourusername/chrome-extension-auto-publisher/Release%20&%20Publish)
![GitHub license](https://img.shields.io/github/license/yourusername/chrome-extension-auto-publisher)

## Features

- **Small codebase** (<500 LOC) using TypeScript, Vite, and Manifest V3
- **Out-of-the-box tooling** with ESLint, Vitest, and Prettier
- **Zero-touch CI/CD pipeline** with GitHub Actions that:
  - Installs dependencies and runs tests
  - Builds the production bundle
  - Generates a ZIP archive
  - Auto-increments the version in manifest.json and package.json
  - Creates GitHub releases with changelog excerpts from commits
  - Publishes to Chrome Web Store automatically

## Quick Start - 1-Click Fork & Ship

1. **Fork this repository**

2. **Set up required GitHub secrets**
   
   Go to your repository's Settings > Secrets and variables > Actions and add these secrets:
   
   - `CHROME_CLIENT_ID` - from Google Cloud Console
   - `CHROME_CLIENT_SECRET` - from Google Cloud Console
   - `CHROME_REFRESH_TOKEN` - generated using OAuth 2.0
   - `CHROME_EXTENSION_ID` - from your Chrome Web Store Developer Dashboard
   
   (The `GITHUB_TOKEN` secret is automatically available)

3. **Create your Google Apps Script**
   
   ```javascript
   function doPost(e) {
     // Parse the incoming data
     const data = JSON.parse(e.postData.contents);
     const tableData = data.tableData;
     
     // Create a new spreadsheet
     const spreadsheet = SpreadsheetApp.create('Table Import ' + new Date().toISOString());
     const sheet = spreadsheet.getActiveSheet();
     
     // Write the data to the spreadsheet
     tableData.forEach((row, rowIndex) => {
       row.forEach((cell, colIndex) => {
         sheet.getRange(rowIndex + 1, colIndex + 1).setValue(cell);
       });
     });
     
     // Format the header row
     if (tableData.length > 0) {
       const headerRange = sheet.getRange(1, 1, 1, tableData[0].length);
       headerRange.setFontWeight('bold');
     }
     
     // Return the URL of the new spreadsheet
     return ContentService.createTextOutput(JSON.stringify({
       spreadsheetUrl: spreadsheet.getUrl()
     })).setMimeType(ContentService.MimeType.JSON);
   }
   ```

4. **Deploy the Apps Script as a web app**
   
   - In Google Apps Script, click Deploy > New Deployment
   - Select type: Web app
   - Set "Who has access" to "Anyone"
   - Copy the deployment URL

5. **Push a commit to your main branch**
   
   Make any small change and push to the main branch to trigger the GitHub Action.

## Customizing Your Extension in <5 Minutes

### Changing the Name and Description

1. Edit the `manifest.json` file:

   ```json
   {
     "name": "Your Extension Name",
     "description": "Your custom description here"
   }
   ```

2. Update the name in `package.json`:

   ```json
   {
     "name": "your-extension-name"
   }
   ```

### Changing Icons

1. Replace the icon files in the `/public/icons` folder:
   - `16.png` (16×16)
   - `48.png` (48×48)
   - `128.png` (128×128)

### Customizing the Feature

The main functionality is in these files:

- `src/background/index.ts` - Background script for context menus
- `src/content-script/index.ts` - Content script for table extraction
- `src/popup/index.html` and `src/popup/index.ts` - Configuration UI

## Development

### Local Development

```bash
# Install dependencies
yarn

# Start development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

### Linting and Formatting

```bash
# Run linter
yarn lint

# Format code with Prettier
yarn format
```

## Google Apps Script Setup

1. Create a new Google Apps Script project at [script.google.com](https://script.google.com)
2. Copy the Apps Script code from the Quick Start section above
3. Deploy as a web app (Deploy > New Deployment > Web App)
4. Set "Who has access" to "Anyone"
5. Copy the web app URL and paste it into the extension settings

## Chrome Web Store Setup

1. Register as a developer at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Create a new item and get your extension ID
3. Set up OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
4. Generate refresh token using [chrome-webstore-upload-cli](https://github.com/DrewML/chrome-webstore-upload-cli)
5. Add the secrets to your GitHub repository

## CI/CD Pipeline Details

- Workflow file: `.github/workflows/publish.yml`
- Triggered on pushes to `main` that modify `src/**` or `manifest.json`
- Uses semantic versioning with auto-bump for patch versions
- Generates changelog from commit messages
- Creates GitHub releases with the changelog excerpt

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/)
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.