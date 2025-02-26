import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.webkitSpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  onresult = null;
  start = vi.fn();
  stop = vi.fn();
}

window.webkitSpeechRecognition = MockSpeechRecognition;

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
