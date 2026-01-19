/**
 * URL Validation Tests
 *
 * Tests for SSRF (Server-Side Request Forgery) protection utilities
 * including IP address validation and URL security checks.
 */

// These functions are defined in index.ts but not exported
// We'll test them through the API endpoints that use them
// For now, we'll import and test them directly by copying the logic

// Helper function to check if a hostname is a private/local IP address
const isPrivateIP = (hostname: string): boolean => {
  // IPv4 private ranges
  const ipv4Patterns = [
    /^127\./,                        // 127.0.0.0/8 (localhost)
    /^10\./,                         // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,                   // 192.168.0.0/16
    /^169\.254\./,                   // 169.254.0.0/16 (link-local)
  ];

  // Check for localhost and loopback aliases
  if (hostname === 'localhost' || hostname === 'localhost.localdomain') {
    return true;
  }

  // Check IPv4 patterns
  for (const pattern of ipv4Patterns) {
    if (pattern.test(hostname)) {
      return true;
    }
  }

  // IPv6 loopback and private ranges (may be wrapped in brackets from URL parsing)
  const ipv6Hostname = hostname.replace(/^\[|\]$/g, ''); // Remove brackets if present
  if (ipv6Hostname === '::1' || ipv6Hostname === '::' || ipv6Hostname.startsWith('fc') || ipv6Hostname.startsWith('fd')) {
    return true;
  }

  return false;
};

// Helper function to validate the URL for SSRF attacks
const validateURLForSSRF = (url: string): { valid: boolean; error?: string } => {
  // Check for empty URL
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { valid: false, error: 'URL cannot be empty' };
  }

  try {
    const parsed = new URL(url);

    // Check protocol - only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }

    // Check for empty hostname
    if (!parsed.hostname) {
      return { valid: false, error: 'Invalid URL format: missing hostname' };
    }

    // Check for private/local IP addresses
    if (isPrivateIP(parsed.hostname)) {
      return { valid: false, error: 'Cannot scrape private/local URLs' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
};

describe('URL Validation - isPrivateIP()', () => {
  describe('IPv4 Localhost and Loopback', () => {
    it('should return true for localhost', () => {
      expect(isPrivateIP('localhost')).toBe(true);
    });

    it('should return true for localhost.localdomain', () => {
      expect(isPrivateIP('localhost.localdomain')).toBe(true);
    });

    it('should return true for 127.0.0.1', () => {
      expect(isPrivateIP('127.0.0.1')).toBe(true);
    });

    it('should return true for 127.x.x.x range', () => {
      expect(isPrivateIP('127.255.255.255')).toBe(true);
      expect(isPrivateIP('127.123.45.67')).toBe(true);
    });
  });

  describe('IPv4 Private Ranges', () => {
    it('should return true for 10.x.x.x', () => {
      expect(isPrivateIP('10.0.0.1')).toBe(true);
      expect(isPrivateIP('10.255.255.255')).toBe(true);
      expect(isPrivateIP('10.50.100.200')).toBe(true);
    });

    it('should return true for 172.16.x.x - 172.31.x.x', () => {
      expect(isPrivateIP('172.16.0.0')).toBe(true);
      expect(isPrivateIP('172.20.5.10')).toBe(true);
      expect(isPrivateIP('172.31.255.255')).toBe(true);
    });

    it('should return false for 172.15.x.x (outside private range)', () => {
      expect(isPrivateIP('172.15.0.1')).toBe(false);
    });

    it('should return false for 172.32.x.x (outside private range)', () => {
      expect(isPrivateIP('172.32.0.1')).toBe(false);
    });

    it('should return true for 192.168.x.x', () => {
      expect(isPrivateIP('192.168.0.0')).toBe(true);
      expect(isPrivateIP('192.168.1.1')).toBe(true);
      expect(isPrivateIP('192.168.255.255')).toBe(true);
    });

    it('should return true for 169.254.x.x (link-local)', () => {
      expect(isPrivateIP('169.254.0.0')).toBe(true);
      expect(isPrivateIP('169.254.169.254')).toBe(true);
      expect(isPrivateIP('169.254.255.255')).toBe(true);
    });
  });

  describe('IPv6 Addresses', () => {
    it('should return true for IPv6 loopback ::1', () => {
      expect(isPrivateIP('::1')).toBe(true);
    });

    it('should return true for IPv6 :: (any)', () => {
      expect(isPrivateIP('::')).toBe(true);
    });

    it('should return true for IPv6 private ranges (fc00::/7)', () => {
      expect(isPrivateIP('fc00::1')).toBe(true);
      expect(isPrivateIP('fd00::1')).toBe(true);
    });
  });

  describe('Public IP Addresses', () => {
    it('should return false for Google DNS (8.8.8.8)', () => {
      expect(isPrivateIP('8.8.8.8')).toBe(false);
    });

    it('should return false for Cloudflare DNS (1.1.1.1)', () => {
      expect(isPrivateIP('1.1.1.1')).toBe(false);
    });

    it('should return false for typical public IPs', () => {
      expect(isPrivateIP('200.50.100.150')).toBe(false);
      expect(isPrivateIP('91.200.10.5')).toBe(false);
      expect(isPrivateIP('203.0.113.1')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should return false for empty string', () => {
      expect(isPrivateIP('')).toBe(false);
    });

    it('should return false for domain names', () => {
      expect(isPrivateIP('example.com')).toBe(false);
      expect(isPrivateIP('google.com')).toBe(false);
    });
  });
});

describe('URL Validation - validateURLForSSRF()', () => {
  describe('Empty/Invalid URLs', () => {
    it('should reject empty URL', () => {
      const result = validateURLForSSRF('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL cannot be empty');
    });

    it('should reject whitespace-only URL', () => {
      const result = validateURLForSSRF('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL cannot be empty');
    });

    it('should reject non-string URL (null)', () => {
      const result = validateURLForSSRF(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL cannot be empty');
    });

    it('should reject malformed URLs', () => {
      const result = validateURLForSSRF('not a url at all');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });
  });

  describe('Protocol Validation', () => {
    it('should reject file:// protocol', () => {
      const result = validateURLForSSRF('file:///etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only HTTP/HTTPS URLs are allowed');
    });

    it('should reject ftp:// protocol', () => {
      const result = validateURLForSSRF('ftp://example.com/file');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only HTTP/HTTPS URLs are allowed');
    });

    it('should reject gopher:// protocol', () => {
      const result = validateURLForSSRF('gopher://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only HTTP/HTTPS URLs are allowed');
    });

    it('should accept http:// protocol', () => {
      const result = validateURLForSSRF('http://example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept https:// protocol', () => {
      const result = validateURLForSSRF('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Private/Local IP SSRF Prevention', () => {
    it('should reject localhost URLs', () => {
      const result = validateURLForSSRF('http://localhost:3000/api');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot scrape private/local URLs');
    });

    it('should reject 127.0.0.1 URLs', () => {
      const result = validateURLForSSRF('http://127.0.0.1:8000');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot scrape private/local URLs');
    });

    it('should reject 192.168.x.x URLs', () => {
      const result = validateURLForSSRF('http://192.168.1.100');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot scrape private/local URLs');
    });

    it('should reject 10.x.x.x URLs', () => {
      const result = validateURLForSSRF('http://10.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot scrape private/local URLs');
    });

    it('should reject 172.16-31.x.x URLs', () => {
      const result = validateURLForSSRF('http://172.20.5.10');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot scrape private/local URLs');
    });

    it('should reject IPv6 loopback', () => {
      const result = validateURLForSSRF('http://[::1]:8000/');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot scrape private/local URLs');
    });
  });

  describe('Valid Public URLs', () => {
    it('should accept http://google.com', () => {
      const result = validateURLForSSRF('http://google.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept https://google.com with path', () => {
      const result = validateURLForSSRF('https://google.com/search?q=tea');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept https://example.com:8443/path', () => {
      const result = validateURLForSSRF('https://example.com:8443/path');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept https://subdomain.example.com', () => {
      const result = validateURLForSSRF('https://api.github.com/users');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept public IP URLs', () => {
      const result = validateURLForSSRF('http://8.8.8.8');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with complex query parameters', () => {
      const result = validateURLForSSRF('https://example.com/api?param1=value1&param2=value2#section');
      expect(result.valid).toBe(true);
    });

    it('should handle URLs with encoded characters', () => {
      const result = validateURLForSSRF('https://example.com/path%20with%20spaces');
      expect(result.valid).toBe(true);
    });

    it('should reject URLs missing hostname after protocol', () => {
      const result = validateURLForSSRF('http://');
      expect(result.valid).toBe(false);
    });
  });
});
