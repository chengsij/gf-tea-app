# Backend Testing Guide

## Quick Start

```bash
cd /Users/serena/dev/gf_tea/tea-app/server
npm test
```

## Test Files

| File | Purpose | Tests | Lines |
|------|---------|-------|-------|
| `__tests__/urlValidation.test.ts` | SSRF protection & URL validation | 46 | 280 |
| `__tests__/api.teas.test.ts` | API CRUD endpoints | 18 | 750 |
| `__tests__/sanity.test.ts` | Jest setup verification | 7 | 60 |

**Total: 71 tests passing**

## Test Commands

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (re-run on file change)
npm run test:watch

# Run specific test file
npm test urlValidation.test.ts
npm test api.teas.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should delete"
npm test -- --testNamePattern="SSRF|URL"

# Verbose output
npm test -- --verbose
```

## Test Organization

### URL Validation Tests (`urlValidation.test.ts`)

Tests the SSRF (Server-Side Request Forgery) protection:

```
isPrivateIP() tests:
├── IPv4 Localhost/Loopback (4 tests)
├── IPv4 Private Ranges (6 tests)
├── IPv6 Addresses (3 tests)
├── Public IP Addresses (3 tests)
└── Edge Cases (2 tests)

validateURLForSSRF() tests:
├── Empty/Invalid URLs (4 tests)
├── Protocol Validation (5 tests)
├── Private/Local IP Prevention (6 tests)
├── Valid Public URLs (5 tests)
└── Edge Cases (3 tests)
```

**Key Validations**:
- Localhost and 127.x.x.x rejection
- Private IP ranges: 10.x, 172.16-31.x, 192.168.x, 169.254.x
- IPv6 loopback (::1) and private (fc/fd) rejection
- Protocol whitelist (http/https only)
- Malformed URL rejection

### API Tests (`api.teas.test.ts`)

Tests the three main endpoints:

```
GET /api/teas (4 tests):
├── 200 status on successful retrieval
├── Returns array of teas
├── Returns empty array when no data
└── Validates response structure

POST /api/teas (9 tests):
├── Creates tea with valid data (201)
├── Rejects invalid tea type (400)
├── Rejects missing required fields
├── Auto-generates unique IDs
├── Normalizes tea type variations
└── Persists to YAML file

DELETE /api/teas/:id (5 tests):
├── Deletes existing tea (204)
├── Returns 404 for missing tea
├── Actually removes from collection
├── Persists deletion to file
└── Handles invalid IDs gracefully
```

## Test Data

- Uses temporary `.test-data` directory
- Each test gets a unique YAML file
- Automatic cleanup after each test
- No interference between tests

Example test data structure:
```yaml
- id: '1768672914246'
  name: Test Tea
  type: Green
  image: https://example.com/image.jpg
  steepTimes: [10, 15, 20]
  caffeine: Low caffeine
  caffeineLevel: Low
  website: https://example.com
  brewingTemperature: 175F
  teaWeight: 5g
```

## Understanding Test Output

```
PASS __tests__/api.teas.test.ts
  GET /api/teas
    ✓ should return 200 status (16 ms)
    ✓ should return an array (2 ms)
  POST /api/teas
    ✓ should create tea (201 status) (4 ms)
  DELETE /api/teas/:id
    ✓ should delete existing tea (2 ms)

Test Suites: 3 passed, 3 total
Tests:       66 passed, 66 total
```

## Common Test Issues

### Issue: "Cannot find module" errors
**Solution**: Ensure you're running from the server directory:
```bash
cd /Users/serena/dev/gf_tea/tea-app/server
npm test
```

### Issue: Tests failing inconsistently
**Solution**: Might be timing issues with file operations. Tests include delays where needed to ensure unique timestamps. File cleanup is automatic.

### Issue: Port already in use
**Solution**: Tests use in-memory supertest app, not actual port 3001. No conflicts should occur.

## Test Coverage Strategy

The tests focus on:
- **Happy path**: Successful operations with valid data
- **Error cases**: Invalid input, missing data, not found scenarios
- **Security**: SSRF attack prevention, URL validation
- **Persistence**: Data written to and read from YAML file
- **Integration**: End-to-end request/response cycles

Not covered (by design for focused testing):
- Puppeteer browser integration (would require mocking)
- Server startup/shutdown lifecycle
- Stress testing/load testing
- Full edge case combinations

## Extending Tests

### Adding a new test to POST endpoint:

```typescript
it('should validate custom field', async () => {
  const app = createTestApp(testDataFile);

  const newTea = {
    name: 'Test Tea',
    type: 'Green',
    image: 'http://example.com/image.jpg',
    steepTimes: [10, 15, 20],
    caffeine: 'Low',
    caffeineLevel: 'Low',
    website: 'http://example.com',
    brewingTemperature: '175F',
    teaWeight: '5g',
  };

  const response = await request(app).post('/api/teas').send(newTea);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  // Add your assertion here
});
```

### Adding URL validation test:

```typescript
it('should reject [specific pattern]', () => {
  const result = validateURLForSSRF('[test URL]');
  expect(result.valid).toBe(false);
  expect(result.error).toContain('[expected error]');
});
```

## CI/CD Integration

To add to a CI pipeline:

```yaml
test:
  script:
    - cd /Users/serena/dev/gf_tea/tea-app/server
    - npm ci
    - npm test
  coverage: '/Lines\s+:\s+(\d+\.\d+)%/'
```

## Performance

- Tests complete in ~0.8-1.1 seconds
- Minimal I/O (only YAML file operations)
- No database connections
- No network calls (mocked)

## Debugging Tests

Enable verbose output:
```bash
npm test -- --verbose
```

Run single test:
```bash
npm test -- --testNamePattern="specific test name"
```

Check console.log output (still appears even with test output):
```bash
npm test -- --verbose --no-coverage
```

## Resources

- Jest Documentation: https://jestjs.io/
- Supertest Documentation: https://github.com/visionmedia/supertest
- TypeScript Testing: https://www.typescriptlang.org/docs/handbook/testing.html
