# Tea Timer App

A full-stack web application for managing a tea collection, brewing steep times, and tracking countdown timers with audio notifications. Built with React, Express, and TypeScript, featuring a secure architecture with comprehensive testing.

## Overview

The Tea Timer App is a production-ready application that helps tea enthusiasts:
- Organize and manage their tea collection with detailed brewing parameters
- Set countdown timers for tea steeping with audio notifications
- Import tea information directly from URLs using web scraping
- Experience a modern, responsive interface with real-time updates

### Key Highlights

- **Type-Safe Architecture**: Full TypeScript with Zod schema validation on both frontend and backend
- **Comprehensive Testing**: 141+ unit and integration tests with SSRF protection validation
- **Security First**: Built-in protection against server-side request forgery (SSRF) attacks
- **Modern UX**: Toast notifications, loading states, and comprehensive error handling
- **Easy Deployment**: Single-click startup with included shell scripts
- **Zero Database**: File-based persistence using YAML (no external dependencies)

## Quick Start

### Option 1: Using Startup Scripts (Recommended)

```bash
# From the project root
.scripts/startup.sh

# Your app will be running at:
# - Frontend: http://localhost:5173
# - Backend:  http://localhost:3001

# To stop the servers:
.scripts/shutdown.sh
```

### Option 2: Manual Setup

```bash
cd tea-app

# Install dependencies (if not already installed)
npm install

# Backend (in one terminal)
cd server
npm start

# Frontend (in another terminal)
cd ..
npm run dev

# Access at http://localhost:5173
```

## Features

### Tea Collection Management
- Create and organize teas with detailed parameters:
  - Tea name, type (Green, Black, Oolong, White, Yellow, PuEr, Gongfu)
  - Multiple steep times with customizable durations
  - Brewing temperature and tea weight specifications
  - Caffeine level information and brewing notes
  - Direct links to tea websites

### Countdown Timer System
- Audio-notified timers triggered from tea cards
- Global timer state with visual countdown display
- Support for sequential steeping (multiple steep times per tea)
- Automatic Web Audio notifications when timers complete

### URL Import Feature
- Scrape tea information directly from e-commerce websites
- Automatic extraction of:
  - Tea name and type
  - Product images
  - Steep times from page content
  - Brewing parameters
- SSRF protection prevents attacks on internal networks

### User Experience
- **Toast Notifications**: Real-time feedback for all user actions
- **Loading States**: Visual indicators for async operations
- **Error Handling**: Comprehensive error messages and graceful degradation
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Filter & Sort**: Find and organize teas by name, type, or steep count

## Tech Stack

### Frontend
- **React 19.2.0** - UI framework with hooks
- **TypeScript 5.9** - Static type checking
- **Vite 7.2** - Fast build tool with HMR
- **Axios 1.13** - Type-safe HTTP client
- **Zod 4.3** - Runtime schema validation
- **Sonner 2.0** - Toast notification library
- **Lucide React 0.562** - Icon components
- **Testing Library 16.3** - Component testing utilities

### Backend
- **Express 5.2.1** - REST API framework
- **TypeScript 5.9** - Typed backend code
- **Puppeteer 24.35** - Headless browser for scraping
- **Cheerio 1.1** - DOM parsing for data extraction
- **js-yaml 4.1** - YAML file handling
- **Zod 4.3** - Request/response validation
- **CORS 2.8** - Cross-origin request handling

### Testing & Quality
- **Vitest 4.0** - Unit tests for frontend
- **Jest 30.2** - Backend test framework
- **Testing Library** - Component testing
- **Supertest 7.2** - HTTP assertion library
- **ESLint 9.39** - Code style enforcement

### Data Storage
- **YAML File** (`server/teas.yaml`) - Single source of truth
- Simple, human-readable format
- No database setup required

## Development

### Running the Application

```bash
cd tea-app

# Development mode with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Running Tests

#### Frontend Tests
```bash
cd tea-app

# Run all tests
npm test

# Run tests with UI dashboard
npm test:ui

# Generate coverage report
npm test:coverage
```

#### Backend Tests
```bash
cd tea-app/server

# Run all tests
npm test

# Run with watch mode (re-run on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- urlValidation.test.ts
npm test -- api.teas.test.ts
```

### Backend Test Suite

The backend includes 141+ comprehensive tests covering:

**URL Validation Tests** (`urlValidation.test.ts`):
- SSRF attack prevention (46 tests)
- Private IP range detection (IPv4 and IPv6)
- Protocol whitelist validation
- Malformed URL rejection

**API Endpoint Tests** (`api.teas.test.ts`):
- GET /api/teas - Retrieve all teas
- POST /api/teas - Create new tea with validation
- DELETE /api/teas/:id - Delete tea by ID
- End-to-end data persistence verification

**Frontend Tests**:
- Component rendering and interaction
- Timer context state management
- Filter and sort functionality
- Toast notification behavior

Run tests with:
```bash
npm test           # All tests
npm test:coverage  # With coverage report
npm test:ui        # Interactive UI (frontend only)
```

## Project Structure

```
tea-app/
├── src/                        # Frontend source code
│   ├── components/             # React components
│   │   ├── FilterBar.tsx       # Tea filtering UI
│   │   ├── SortControls.tsx    # Sorting controls
│   │   ├── TeaCard.tsx         # Individual tea display
│   │   └── *.test.tsx          # Component tests
│   ├── utils/                  # Utility functions
│   │   ├── toast.ts            # Toast notification helper
│   │   └── toast.test.ts       # Toast tests
│   ├── test/                   # Test setup
│   │   ├── setup.ts            # Vitest configuration
│   │   └── sanity.test.ts      # Basic setup verification
│   ├── App.tsx                 # Main application component
│   ├── App.css                 # Responsive styles
│   ├── TimerContext.tsx        # Global timer state (Context API)
│   ├── TimerContext.test.tsx   # Timer tests
│   ├── api.ts                  # Axios API client
│   ├── types.ts                # Zod schemas for validation
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
│
├── server/                     # Backend source code
│   ├── index.ts                # Express server and API endpoints
│   ├── __tests__/              # Backend test suite
│   │   ├── api.teas.test.ts    # API endpoint tests
│   │   ├── urlValidation.test.ts # SSRF protection tests
│   │   └── sanity.test.ts      # Setup verification
│   ├── teas.yaml               # Tea data storage
│   ├── package.json            # Backend dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   └── jest.config.js          # Jest configuration
│
├── .scripts/                   # Startup and shutdown utilities
│   ├── startup.sh              # Start both frontend and backend
│   ├── shutdown.sh             # Stop both servers
│   └── .pids/                  # Process ID tracking
│
├── shared/                     # Shared code between frontend and backend
├── public/                     # Static assets
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # Frontend TypeScript config
├── eslint.config.js            # ESLint configuration
└── package.json                # Frontend dependencies
```

## API Reference

All endpoints are prefixed with `/api`:

### GET /api/teas
Retrieve all teas in the collection.

**Response:**
```json
[
  {
    "id": "1768672914246",
    "name": "Dragon Well",
    "type": "Green",
    "image": "https://example.com/image.jpg",
    "steepTimes": [30, 45, 60],
    "brewingTemperature": "175F",
    "teaWeight": "5g",
    "caffeineLevel": "Low"
  }
]
```

### POST /api/teas
Create a new tea entry.

**Request Body:**
```json
{
  "name": "Dragon Well",
  "type": "Green",
  "image": "https://example.com/image.jpg",
  "steepTimes": [30, 45, 60],
  "brewingTemperature": "175F",
  "teaWeight": "5g",
  "caffeineLevel": "Low"
}
```

**Response:** 201 Created with new tea object including generated `id`

### DELETE /api/teas/:id
Delete a tea by ID.

**Response:** 204 No Content on success, 404 if not found

### POST /api/teas/import
Import tea data from a URL.

**Request Body:**
```json
{
  "url": "https://example.com/tea-product"
}
```

**Response:** Pre-filled tea data for form submission

**Security:** Built-in SSRF protection prevents scraping internal networks

## Architecture Highlights

### Type Safety
- **Zod Schemas**: Shared between frontend and backend
- Both layers validate data independently
- Runtime guarantees match TypeScript compile-time checks
- Prevents invalid data from entering the system

### State Management
- **Context API** for timer state (no Redux needed for this scale)
- Global `TimerContext` provides `useTimer()` hook
- Centralized countdown logic with 1-second intervals
- Web Audio API for notification sounds

### API Design
- RESTful endpoints with proper HTTP status codes
- Comprehensive error responses with descriptive messages
- Zod validation on all inputs
- CORS enabled for local development

### Security Features
- **SSRF Protection**: URL validation blocks internal IP ranges
  - Prevents access to 127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x
  - Blocks IPv6 loopback (::1) and private ranges (fc00::/7, fd00::/8)
  - Protocol whitelist (http/https only)
- **Input Validation**: All user inputs validated with Zod schemas
- **Error Boundaries**: Graceful error handling throughout the app

### Performance
- **Puppeteer Browser Pooling**: Single headless browser instance reused for scraping
- **Resource Blocking**: Images, CSS, media blocked during scraping
- **Vite HMR**: Instant feedback during development
- **File-Based Storage**: Simple, fast I/O without database overhead

## Environment Configuration

Create a `.env` file in the `server` directory (optional):

```env
# Backend configuration
PORT=3001
NODE_ENV=development
```

See `server/.env.example` for available options.

## Scripts Reference

### Root Level Scripts
```bash
.scripts/startup.sh   # Start both frontend and backend
.scripts/shutdown.sh  # Stop both servers
```

### Frontend Scripts (from tea-app/)
```bash
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run lint          # Check code style
npm run preview       # Preview production build
npm test              # Run tests
npm test:ui           # Interactive test dashboard
npm test:coverage     # Coverage report
```

### Backend Scripts (from tea-app/server/)
```bash
npm start             # Start Express server (ts-node)
npm test              # Run test suite
npm test:watch        # Run tests in watch mode
npm test:coverage     # Generate coverage report
```

## Deployment

### Building for Production
```bash
cd tea-app
npm run build
```

This generates:
- Frontend: `dist/` (ready to serve as static files)
- Backend: Ready to run with `npm start`

### Hosting Options
- **Frontend**: Deploy `dist/` to any static host (Vercel, Netlify, AWS S3)
- **Backend**: Run on any Node.js host (Heroku, Railway, AWS EC2, etc.)
- **Data**: YAML file can be stored in mounted volume or persistent storage

### Production Considerations
- Update `API_BASE_URL` in frontend for backend location
- Use environment variables for sensitive configuration
- Enable HTTPS for production deployments
- Consider adding authentication/authorization
- Set up monitoring and logging

## Common Development Tasks

### Adding a New Tea Property
1. Update `TeaSchema` in `src/types.ts` with Zod validation
2. Update API endpoint in `server/index.ts` to handle new field
3. Update form component in `src/App.tsx`
4. YAML persistence and API responses automatically include it

### Debugging Timer Issues
- Check `src/TimerContext.tsx` for countdown logic
- Verify `startTimer()` called with correct parameters
- Check browser console for Web Audio API errors
- Use React DevTools to inspect Context state

### Debugging API Calls
- Check DevTools Network tab (frontend to http://localhost:3001/api)
- Review server console logs for validation errors
- Verify `server/teas.yaml` exists and is valid YAML
- Enable verbose logging in `server/index.ts`

### Testing URL Scraping
Use curl or Postman to test the import endpoint:
```bash
curl -X POST http://localhost:3001/api/teas/import \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/tea-product"}'
```

## Troubleshooting

### Startup Issues

**Port already in use:**
```bash
# Kill existing processes
.scripts/shutdown.sh

# Or manually:
lsof -i :3001  # Backend
lsof -i :5173  # Frontend
kill -9 <PID>
```

**Startup script permission denied:**
```bash
chmod +x .scripts/startup.sh
chmod +x .scripts/shutdown.sh
```

### Backend Issues

**Module not found errors:**
```bash
cd tea-app/server
npm install
```

**YAML file corruption:**
```bash
# Reset teas.yaml
rm tea-app/server/teas.yaml
npm start  # Will create fresh file
```

### Frontend Issues

**Vite hot reload not working:**
- Ensure backend is running on port 3001
- Check `src/api.ts` for correct API base URL
- Restart Vite dev server

**API calls failing:**
- Verify backend started successfully
- Check backend logs for errors
- Ensure CORS is enabled in `server/index.ts`

## Performance Tips

- Tea images load asynchronously; consider optimizing image sizes
- For large tea collections (100+), consider adding pagination
- Browser DevTools Lighthouse can identify additional optimizations
- Use `npm run test:coverage` to identify untested code paths

## Contributing

When making changes:
1. Run `npm run lint` to check code style
2. Run `npm test` to verify all tests pass
3. Add tests for new features
4. Update README if adding new functionality

## License

ISC

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Jest Testing Framework](https://jestjs.io/)
- [Zod Documentation](https://zod.dev/)

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review test files to understand expected behavior
3. Check backend logs at `.scripts/backend.log`
4. Check frontend logs at `.scripts/frontend.log`
