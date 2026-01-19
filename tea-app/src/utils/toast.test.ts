import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showSuccess, showError, showInfo, showWarning } from './toast';

// Mock the 'sonner' library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('Toast Utilities', () => {
  beforeEach(() => {
    // Clear mock call history before each test
    vi.clearAllMocks();
  });

  describe('showSuccess', () => {
    it('should call toast.success with the provided message', () => {
      const message = 'Tea added successfully!';
      showSuccess(message);

      expect(toast.success).toHaveBeenCalledWith(message);
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('should handle empty strings', () => {
      showSuccess('');

      expect(toast.success).toHaveBeenCalledWith('');
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(500);
      showSuccess(longMessage);

      expect(toast.success).toHaveBeenCalledWith(longMessage);
    });
  });

  describe('showError', () => {
    it('should call toast.error with the provided message', () => {
      const message = 'Failed to delete tea';
      showError(message);

      expect(toast.error).toHaveBeenCalledWith(message);
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('should handle error messages with special characters', () => {
      const message = 'Error: Something went wrong! (code: 500)';
      showError(message);

      expect(toast.error).toHaveBeenCalledWith(message);
    });
  });

  describe('showInfo', () => {
    it('should call toast.info with the provided message', () => {
      const message = 'Loading teas...';
      showInfo(message);

      expect(toast.info).toHaveBeenCalledWith(message);
      expect(toast.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('showWarning', () => {
    it('should call toast.warning with the provided message', () => {
      const message = 'This action cannot be undone';
      showWarning(message);

      expect(toast.warning).toHaveBeenCalledWith(message);
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple calls', () => {
    it('should handle multiple consecutive calls correctly', () => {
      showSuccess('First');
      showError('Second');
      showInfo('Third');
      showWarning('Fourth');

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledTimes(1);
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });
  });
});
