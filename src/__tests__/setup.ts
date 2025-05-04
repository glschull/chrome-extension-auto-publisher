/**
 * Test setup file for Vitest
 * This file runs before your tests to set up the testing environment
 */

import { vi } from 'vitest';

// Mock the Chrome API for testing
const chromeMock = {
  runtime: {
    onInstalled: {
      addListener: vi.fn(),
    },
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    getManifest: () => ({ version: '1.0.0' }),
    getURL: vi.fn().mockImplementation((path) => `chrome-extension://fake-id/${path}`),
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  tabs: {
    sendMessage: vi.fn(),
    create: vi.fn(),
  },
} as unknown as typeof chrome;

// Add chrome to global
globalThis.chrome = chromeMock;