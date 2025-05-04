import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../background/index';
describe('Background Script', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });
    it('should create context menu on install', () => {
        // Get the onInstalled listener and trigger it
        const listener = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
        listener();
        // Check that the context menu was created
        expect(chrome.contextMenus.create).toHaveBeenCalledWith({
            id: 'copyTableToSheets',
            title: 'Copy Table to Google Sheets',
            contexts: ['all'],
        });
    });
    it('should send message to content script when context menu is clicked', () => {
        // Get the onClicked listener
        const listener = chrome.contextMenus.onClicked.addListener.mock.calls[0][0];
        // Call the listener with test data
        listener({ menuItemId: 'copyTableToSheets' }, { id: 123 });
        // Check that the message was sent to the content script
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
            action: 'extractTable'
        });
    });
});
