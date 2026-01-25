# Logging System Implementation Plan

**Date:** January 24, 2026
**Design Doc:** `2026-01-24-logging-system-design.md`
**Branch:** `feature/logging`
**Worktree:** `.worktrees/logging`

---

## Task Breakdown

### Task 1: Install Winston dependencies
**File:** `tea-app/server/package.json`

**Steps:**
1. Navigate to `.worktrees/logging/tea-app/server`
2. Run: `npm install winston winston-daily-rotate-file`
3. Verify installation: `npm list winston`

**Verification:**
- `package.json` contains winston dependencies
- `node_modules/winston` exists

**Commit:** `feat: Add winston logging dependencies`

---

### Task 2: Create logger instance
**File:** `tea-app/server/logger.ts` (new)

**Steps:**
1. Create `tea-app/server/logger.ts`
2. Import winston and DailyRotateFile
3. Configure logger with:
   - Console transport
   - Daily rotating file for combined logs (7d retention, 20MB max)
   - Daily rotating file for error logs (7d retention, 20MB max)
   - Timestamp format: 'YYYY-MM-DD HH:mm:ss'
   - Custom format with stack trace support
4. Export logger as default

**Code reference:** See design doc lines 150-183

**Verification:**
- File compiles without TypeScript errors
- Logger exports successfully

**Commit:** `feat: Create Winston logger instance with rotating transports`

---

### Task 3: Add logs directory to .gitignore
**Files:** `tea-app/.gitignore`, `tea-app/logs/.gitignore` (new)

**Steps:**
1. Add `logs/` to `tea-app/.gitignore`
2. Create `tea-app/logs/.gitignore` with content: `*`

**Verification:**
- `git status` doesn't show logs directory
- `.gitignore` contains logs entry

**Commit:** `chore: Add logs directory to gitignore`

---

### Task 4: Add request logging middleware
**File:** `tea-app/server/index.ts`

**Steps:**
1. Import logger at top of file
2. Create middleware function that:
   - Captures request start time
   - Waits for response to finish (using `on-finished` package or response event)
   - Calculates duration (end - start)
   - Logs: `${method} ${path} ${statusCode} ${duration}ms`
   - If duration >1000ms, log at WARN level with "(slow request)" suffix
   - Otherwise log at INFO level
3. Add middleware BEFORE all API routes but AFTER body parsing

**Verification:**
- Middleware compiles without errors
- Middleware is placed correctly in middleware stack

**Commit:** `feat: Add HTTP request logging middleware`

---

### Task 5: Add startup logging
**File:** `tea-app/server/index.ts`

**Steps:**
1. Find server startup code (app.listen)
2. Replace `console.log` with `logger.info` for:
   - Server start message (include port and NODE_ENV)
3. Find Puppeteer initialization
4. Add `logger.info('Puppeteer browser initialized')` after browser launches
5. Find YAML loading code
6. Add `logger.info(\`Loaded ${teas.length} teas from teas.yaml\`)` after loading

**Verification:**
- No console.log statements in startup code
- All startup events logged

**Commit:** `feat: Add startup event logging`

---

### Task 6: Add operational logging for tea CRUD
**File:** `tea-app/server/index.ts`

**Steps:**
1. **POST /api/teas** - After successful creation:
   - `logger.info(\`Tea created - id: ${tea.id}, name: "${tea.name}"\`)`
2. **DELETE /api/teas/:id** - After successful deletion:
   - `logger.info(\`Tea deleted - id: ${id}\`)`
3. **DELETE /api/teas/:id** - When tea not found (404):
   - `logger.warn(\`Delete failed - tea not found: id ${id}\`)`
4. **PUT /api/teas/:id/lastConsumed** - After successful update:
   - `logger.info(\`Tea consumed - id: ${id} (count: ${updatedTea.timesConsumed})\`)`

**Verification:**
- Each CRUD operation has appropriate logging
- Log messages match design spec format

**Commit:** `feat: Add operational logging for tea CRUD operations`

---

### Task 7: Add error logging
**File:** `tea-app/server/index.ts`

**Steps:**
1. Find all try/catch blocks
2. Replace `console.error` with `logger.error` in catch blocks
3. For YAML file operations, log: `Failed to read/write teas.yaml - ${error.message}`
4. For validation errors, log: `Tea validation failed - id: ${id}` with validation details
5. For Puppeteer errors, log: `Puppeteer scraping failed - ${url}: ${error.message}`
6. Add global error handler for uncaught exceptions:
   ```typescript
   process.on('uncaughtException', (error) => {
     logger.error('Uncaught exception', error);
   });
   ```

**Verification:**
- All console.error replaced with logger.error
- Error logs include context (IDs, URLs, etc.)
- Stack traces preserved

**Commit:** `feat: Add comprehensive error logging`

---

### Task 8: Add Puppeteer performance logging
**File:** `tea-app/server/index.ts`

**Steps:**
1. Find POST /api/teas/import endpoint (Puppeteer scraping)
2. Add timing instrumentation:
   - Capture start time before scraping
   - Calculate duration after scraping completes
   - If duration >3000ms, log at WARN: `Slow Puppeteer scrape - ${duration}ms for ${url}`

**Verification:**
- Scraping duration calculated correctly
- Slow scrapes logged at WARN level

**Commit:** `feat: Add performance logging for Puppeteer scraping`

---

### Task 9: Replace remaining console statements
**File:** `tea-app/server/index.ts`

**Steps:**
1. Search for all `console.log` statements in server code
2. Replace with appropriate logger level:
   - Errors → `logger.error`
   - Warnings → `logger.warn`
   - Info → `logger.info`
3. Search for all `console.error` statements
4. Replace with `logger.error`

**Verification:**
- Run: `grep -n "console\." server/index.ts` returns no results
- All logging goes through Winston

**Commit:** `refactor: Replace all console statements with Winston logger`

---

### Task 10: Test logging functionality
**Manual testing in worktree**

**Steps:**
1. Start server: `cd .worktrees/logging/tea-app && ./.scripts/startup.sh`
2. Verify startup logs appear in console
3. Make API requests (GET, POST, DELETE) and verify access logs
4. Verify `logs/combined-YYYY-MM-DD.log` file created
5. Verify `logs/error-YYYY-MM-DD.log` file created (trigger error by deleting non-existent tea)
6. Check log file contents match expected format
7. Stop server

**Verification:**
- Console shows formatted logs with timestamps
- Log files contain same entries
- Access logs show method, path, status, timing
- Error logs contain stack traces

**No commit** - testing only

---

### Task 11: Run full test suite
**Ensure existing tests still pass**

**Steps:**
1. Run: `cd .worktrees/logging/tea-app && npm test`
2. Verify all 134 tests pass
3. Fix any broken tests (logging shouldn't break tests, but verify)

**Verification:**
- All tests pass
- No new console output in test runs (logger might need to be mocked or silenced in tests)

**Commit (if needed):** `test: Update tests for logging integration`

---

### Task 12: Update tests to handle logger
**If tests are failing due to logger output**

**Steps:**
1. Check if logger needs to be mocked in tests
2. If yes, create test utility to silence logger
3. Update test setup files to use silent logger

**Verification:**
- Tests pass without logger output polluting test results

**Commit (if needed):** `test: Add logger mocking for test environment`

---

## Execution Notes

- Work in `.worktrees/logging` directory
- Commit after each task
- Run tests after tasks 9, 11, 12
- Mark tasks as in_progress/completed using TodoWrite

## Post-Implementation

After all tasks complete:
1. Use `superpowers:finishing-a-development-branch` skill
2. Verify all tests pass
3. Merge to main or create PR
