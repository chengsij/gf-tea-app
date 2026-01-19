/**
 * API Tests for /api/teas endpoints
 *
 * Tests for the main CRUD endpoints:
 * - GET /api/teas (retrieve all teas)
 * - POST /api/teas (create new tea)
 * - DELETE /api/teas/:id (delete tea)
 */

import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';

// Define types and schemas locally for testing
const TeaTypeSchema = z.enum(['Green', 'Black', 'PuEr', 'Yellow', 'White', 'Oolong']);
const CaffeineLevelSchema = z.enum(['None', 'Low', 'Medium', 'High']);

const TeaSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: TeaTypeSchema,
  image: z.string(),
  steepTimes: z.array(z.number()),
  caffeine: z.string(),
  caffeineLevel: CaffeineLevelSchema,
  website: z.string(),
  brewingTemperature: z.string(),
  teaWeight: z.string(),
});

type Tea = z.infer<typeof TeaSchema>;

// Create a minimal test Express app with just the endpoints we're testing
const createTestApp = (dataFile: string) => {
  const app = express();

  app.use(express.json());

  // Helper function to check if a hostname is a private/local IP address
  const isPrivateIP = (hostname: string): boolean => {
    const ipv4Patterns = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
    ];

    if (hostname === 'localhost' || hostname === 'localhost.localdomain') {
      return true;
    }

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
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return { valid: false, error: 'URL cannot be empty' };
    }

    try {
      const parsed = new URL(url);

      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
      }

      if (!parsed.hostname) {
        return { valid: false, error: 'Invalid URL format: missing hostname' };
      }

      if (isPrivateIP(parsed.hostname)) {
        return { valid: false, error: 'Cannot scrape private/local URLs' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  };

  const normalizeTeaType = (type: string): string => {
    const normalized = type.toLowerCase().trim();

    if (normalized === 'green') return 'Green';
    if (normalized === 'black') return 'Black';
    if (normalized === 'puer' || normalized === 'pu-er' || normalized === 'pu-erh') return 'PuEr';
    if (normalized === 'yellow') return 'Yellow';
    if (normalized === 'white') return 'White';
    if (normalized === 'oolong') return 'Oolong';

    return type;
  };

  const readTeas = (): Tea[] => {
    try {
      if (!fs.existsSync(dataFile)) {
        return [];
      }

      const fileContents = fs.readFileSync(dataFile, 'utf8');
      const data = yaml.load(fileContents);
      return z.array(TeaSchema).parse(data);
    } catch (error) {
      console.error('Failed to read or parse teas.yaml:', error);
      throw new Error('Failed to read tea collection from file');
    }
  };

  const writeTeas = (teas: Tea[]): boolean => {
    try {
      const yamlStr = yaml.dump(teas);

      const dirPath = path.dirname(dataFile);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(dataFile, yamlStr, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to write teas.yaml:', error);
      throw new Error('Failed to save tea collection to file');
    }
  };

  // GET /api/teas - retrieve all teas
  app.get('/api/teas', (req, res) => {
    try {
      const teas = readTeas();
      res.json(teas);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: 'Failed to read tea collection', details: errorMessage });
    }
  });

  // POST /api/teas - create new tea
  app.post('/api/teas', (req, res) => {
    try {
      if (!req.body) {
        res.status(400).json({ error: 'Request body is required' });
        return;
      }

      let teas;
      try {
        teas = readTeas();
      } catch (readError) {
        res.status(500).json({
          error: 'Failed to read existing tea collection',
          details: readError instanceof Error ? readError.message : 'Unknown error',
        });
        return;
      }

      // Normalize type if present
      const normalizedData = {
        ...req.body,
        type: req.body.type ? normalizeTeaType(req.body.type) : req.body.type,
      };

      let newTeaData;
      try {
        newTeaData = TeaSchema.omit({ id: true }).parse(normalizedData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          res.status(400).json({ error: 'Invalid tea data', details: validationError.issues });
        } else {
          res.status(400).json({
            error: 'Failed to validate tea data',
            details: validationError instanceof Error ? validationError.message : 'Unknown validation error',
          });
        }
        return;
      }

      const newTea: Tea = { ...newTeaData, id: Date.now().toString() };
      teas.push(newTea);

      try {
        writeTeas(teas);
        res.status(201).json(newTea);
      } catch (writeError) {
        res.status(500).json({
          error: 'Failed to save tea',
          details: writeError instanceof Error ? writeError.message : 'Unknown error',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'An unexpected error occurred while saving tea',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // DELETE /api/teas/:id - delete tea
  app.delete('/api/teas/:id', (req, res) => {
    try {
      const teaId = req.params.id;

      if (!teaId) {
        res.status(400).json({ error: 'Tea ID is required' });
        return;
      }

      let teas;
      try {
        teas = readTeas();
      } catch (readError) {
        res.status(500).json({
          error: 'Failed to read tea collection',
          details: readError instanceof Error ? readError.message : 'Unknown error',
        });
        return;
      }

      const teaToDelete = teas.find(t => t.id === teaId);
      if (!teaToDelete) {
        res.status(404).json({ error: 'Tea not found' });
        return;
      }

      const filteredTeas = teas.filter(t => t.id !== teaId);

      try {
        writeTeas(filteredTeas);
        res.status(204).send();
      } catch (writeError) {
        res.status(500).json({
          error: 'Failed to delete tea',
          details: writeError instanceof Error ? writeError.message : 'Unknown error',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'An unexpected error occurred while deleting tea',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return app;
};

describe('GET /api/teas', () => {
  let testDataFile: string;

  beforeEach(() => {
    // Create a temporary test data file in the temp directory
    const tempDir = path.join(__dirname, '.test-data');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    testDataFile = path.join(tempDir, `teas-get-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.yaml`);
  });

  afterEach(() => {
    // Clean up test data files
    const tempDir = path.join(__dirname, '.test-data');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  it('should return 200 status on successful retrieval', async () => {
    const app = createTestApp(testDataFile);

    // Create test data
    const testTeas = [
      {
        id: '123',
        name: 'Test Green Tea',
        type: 'Green',
        image: 'http://example.com/image.jpg',
        steepTimes: [10, 15, 20],
        caffeine: 'Low',
        caffeineLevel: 'Low',
        website: 'http://example.com',
        brewingTemperature: '175F',
        teaWeight: '5g',
      },
    ];
    fs.writeFileSync(testDataFile, yaml.dump(testTeas));

    const response = await request(app).get('/api/teas');

    expect(response.status).toBe(200);
  });

  it('should return an array of teas', async () => {
    const app = createTestApp(testDataFile);

    const testTeas = [
      {
        id: '123',
        name: 'Test Green Tea',
        type: 'Green',
        image: 'http://example.com/image.jpg',
        steepTimes: [10, 15, 20],
        caffeine: 'Low',
        caffeineLevel: 'Low',
        website: 'http://example.com',
        brewingTemperature: '175F',
        teaWeight: '5g',
      },
      {
        id: '456',
        name: 'Test Black Tea',
        type: 'Black',
        image: 'http://example.com/image2.jpg',
        steepTimes: [5, 10],
        caffeine: 'High',
        caffeineLevel: 'High',
        website: 'http://example.com',
        brewingTemperature: '212F',
        teaWeight: '6g',
      },
    ];
    fs.writeFileSync(testDataFile, yaml.dump(testTeas));

    const response = await request(app).get('/api/teas');

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toBe('Test Green Tea');
    expect(response.body[1].name).toBe('Test Black Tea');
  });

  it('should return empty array when no teas exist', async () => {
    const app = createTestApp(testDataFile);

    const response = await request(app).get('/api/teas');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  it('should have correct structure for each tea', async () => {
    const app = createTestApp(testDataFile);

    const testTea = {
      id: '123',
      name: 'Test Oolong Tea',
      type: 'Oolong',
      image: 'http://example.com/image.jpg',
      steepTimes: [20, 30, 40],
      caffeine: 'Medium caffeine',
      caffeineLevel: 'Medium',
      website: 'http://example.com',
      brewingTemperature: '195F',
      teaWeight: '7g',
    };
    fs.writeFileSync(testDataFile, yaml.dump([testTea]));

    const response = await request(app).get('/api/teas');

    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('type');
    expect(response.body[0]).toHaveProperty('image');
    expect(response.body[0]).toHaveProperty('steepTimes');
    expect(response.body[0]).toHaveProperty('caffeine');
    expect(response.body[0]).toHaveProperty('caffeineLevel');
    expect(response.body[0]).toHaveProperty('website');
    expect(response.body[0]).toHaveProperty('brewingTemperature');
    expect(response.body[0]).toHaveProperty('teaWeight');
  });
});

describe('POST /api/teas', () => {
  let testDataFile: string;

  beforeEach(() => {
    const tempDir = path.join(__dirname, '.test-data');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    testDataFile = path.join(tempDir, `teas-post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.yaml`);
  });

  afterEach(() => {
    const tempDir = path.join(__dirname, '.test-data');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  it('should create a new tea with valid data (201 status)', async () => {
    const app = createTestApp(testDataFile);

    const newTea = {
      name: 'New Green Tea',
      type: 'Green',
      image: 'http://example.com/image.jpg',
      steepTimes: [10, 15, 20],
      caffeine: 'Low caffeine',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const response = await request(app).post('/api/teas').send(newTea);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('New Green Tea');
    expect(response.body.type).toBe('Green');
  });

  it('should reject invalid tea type (400 status)', async () => {
    const app = createTestApp(testDataFile);

    const invalidTea = {
      name: 'Invalid Tea',
      type: 'InvalidType',
      image: 'http://example.com/image.jpg',
      steepTimes: [10, 15, 20],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const response = await request(app).post('/api/teas').send(invalidTea);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should reject missing required field (name)', async () => {
    const app = createTestApp(testDataFile);

    const incompleteTea = {
      type: 'Green',
      image: 'http://example.com/image.jpg',
      steepTimes: [10, 15, 20],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const response = await request(app).post('/api/teas').send(incompleteTea);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should reject missing required field (type)', async () => {
    const app = createTestApp(testDataFile);

    const incompleteTea = {
      name: 'Test Tea',
      image: 'http://example.com/image.jpg',
      steepTimes: [10, 15, 20],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const response = await request(app).post('/api/teas').send(incompleteTea);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should reject missing required field (steepTimes)', async () => {
    const app = createTestApp(testDataFile);

    const incompleteTea = {
      name: 'Test Tea',
      type: 'Green',
      image: 'http://example.com/image.jpg',
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const response = await request(app).post('/api/teas').send(incompleteTea);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should reject missing required field (image)', async () => {
    const app = createTestApp(testDataFile);

    const incompleteTea = {
      name: 'Test Tea',
      type: 'Green',
      steepTimes: [10, 15, 20],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const response = await request(app).post('/api/teas').send(incompleteTea);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should auto-generate unique ID for new tea', async () => {
    const app = createTestApp(testDataFile);

    const tea1 = {
      name: 'Tea 1',
      type: 'Green',
      image: 'http://example.com/image.jpg',
      steepTimes: [10],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const tea2 = {
      name: 'Tea 2',
      type: 'Black',
      image: 'http://example.com/image.jpg',
      steepTimes: [5],
      caffeine: 'High',
      caffeineLevel: 'High',
      website: 'http://example.com',
      brewingTemperature: '212F',
      teaWeight: '6g',
    };

    const response1 = await request(app).post('/api/teas').send(tea1);
    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));
    const response2 = await request(app).post('/api/teas').send(tea2);

    expect(response1.body.id).not.toBe(response2.body.id);
  });

  it('should normalize tea type variations', async () => {
    const app = createTestApp(testDataFile);

    const newTea = {
      name: 'Pu-Er Tea',
      type: 'pu-er', // lowercase variant
      image: 'http://example.com/image.jpg',
      steepTimes: [10, 15, 20],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '200F',
      teaWeight: '8g',
    };

    const response = await request(app).post('/api/teas').send(newTea);

    expect(response.status).toBe(201);
    expect(response.body.type).toBe('PuEr'); // Should be normalized
  });

  it('should persist tea to file', async () => {
    const app = createTestApp(testDataFile);

    const newTea = {
      name: 'Persistent Tea',
      type: 'Green',
      image: 'http://example.com/image.jpg',
      steepTimes: [10],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const createResponse = await request(app).post('/api/teas').send(newTea);
    expect(createResponse.status).toBe(201);

    // Verify the tea was persisted by reading it back
    const getResponse = await request(app).get('/api/teas');
    expect(getResponse.body).toHaveLength(1);
    expect(getResponse.body[0].name).toBe('Persistent Tea');
  });
});

describe('DELETE /api/teas/:id', () => {
  let testDataFile: string;

  beforeEach(() => {
    const tempDir = path.join(__dirname, '.test-data');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    testDataFile = path.join(tempDir, `teas-delete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.yaml`);
  });

  afterEach(() => {
    const tempDir = path.join(__dirname, '.test-data');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  it('should delete an existing tea (204 status)', async () => {
    const app = createTestApp(testDataFile);

    // Create a tea first
    const newTea = {
      name: 'Tea to Delete',
      type: 'Green',
      image: 'http://example.com/image.jpg',
      steepTimes: [10],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const createResponse = await request(app).post('/api/teas').send(newTea);
    const teaId = createResponse.body.id;

    // Delete the tea
    const deleteResponse = await request(app).delete(`/api/teas/${teaId}`);

    expect(deleteResponse.status).toBe(204);
  });

  it('should return 404 when deleting non-existent tea', async () => {
    const app = createTestApp(testDataFile);

    const response = await request(app).delete('/api/teas/nonexistent-id');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should actually remove tea from collection', async () => {
    const app = createTestApp(testDataFile);

    // Create two teas
    const tea1 = {
      name: 'Tea 1',
      type: 'Green',
      image: 'http://example.com/image.jpg',
      steepTimes: [10],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const tea2 = {
      name: 'Tea 2',
      type: 'Black',
      image: 'http://example.com/image.jpg',
      steepTimes: [5],
      caffeine: 'High',
      caffeineLevel: 'High',
      website: 'http://example.com',
      brewingTemperature: '212F',
      teaWeight: '6g',
    };

    const createResponse1 = await request(app).post('/api/teas').send(tea1);
    const createResponse2 = await request(app).post('/api/teas').send(tea2);

    const teaId1 = createResponse1.body.id;
    const teaId2 = createResponse2.body.id;

    // Verify both exist
    let getResponse = await request(app).get('/api/teas');
    expect(getResponse.body).toHaveLength(2);

    // Delete the first tea
    await request(app).delete(`/api/teas/${teaId1}`);

    // Verify only the second tea remains
    getResponse = await request(app).get('/api/teas');
    expect(getResponse.body).toHaveLength(1);
    expect(getResponse.body[0].id).toBe(teaId2);
    expect(getResponse.body[0].name).toBe('Tea 2');
  });

  it('should persist deletion to file', async () => {
    const app = createTestApp(testDataFile);

    // Create a tea
    const newTea = {
      name: 'Tea to Delete',
      type: 'Green',
      image: 'http://example.com/image.jpg',
      steepTimes: [10],
      caffeine: 'Low',
      caffeineLevel: 'Low',
      website: 'http://example.com',
      brewingTemperature: '175F',
      teaWeight: '5g',
    };

    const createResponse = await request(app).post('/api/teas').send(newTea);
    const teaId = createResponse.body.id;

    // Delete the tea
    await request(app).delete(`/api/teas/${teaId}`);

    // Create a new app instance and verify the deletion persisted
    const newApp = createTestApp(testDataFile);
    const getResponse = await request(newApp).get('/api/teas');

    expect(getResponse.body).toHaveLength(0);
  });

  it('should handle deleting with invalid ID format gracefully', async () => {
    const app = createTestApp(testDataFile);

    const response = await request(app).delete('/api/teas/totally-fake-id-12345');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Tea not found');
  });
});
