import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import puppeteer from 'puppeteer';

const app = express();
const port = 3001;

const isDist = __dirname.endsWith('dist');
const DATA_FILE = isDist 
  ? path.join(__dirname, '..', 'teas.yaml') 
  : path.join(__dirname, 'teas.yaml');

app.use(cors());
app.use(express.json());

interface Tea {
  id: string;
  name: string;
  type: string;
  image: string;
  steepTimes: number[];
}

const readTeas = (): Tea[] => {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const fileContents = fs.readFileSync(DATA_FILE, 'utf8');
  return (yaml.load(fileContents) as Tea[]) || [];
};

const writeTeas = (teas: Tea[]) => {
  const yamlStr = yaml.dump(teas);
  fs.writeFileSync(DATA_FILE, yamlStr, 'utf8');
};

// Singleton browser instance
let browserInstance: puppeteer.Browser | null = null;

const getBrowser = async () => {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    browserInstance.on('disconnected', () => {
      console.log('Browser disconnected');
      browserInstance = null;
    });
  }
  return browserInstance;
};

app.post('/api/teas/import', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Optimize: Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media', 'script', 'xhr', 'fetch'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch (e) {
      console.log('Navigation timeout or error, proceeding to scrape...');
    }

    const data = await page.evaluate(() => {
      // 1. Name
      const name = document.querySelector('h1.page-title')?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim() || '';

      // 2. Image
      let image = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
      if (!image) {
        // Since we block images, we can still get the src attribute from the DOM
        image = document.querySelector('.gallery-placeholder__image')?.getAttribute('src') || '';
      }

      // 3. Type
      let type = '';
      const validTypes = ['Green', 'Black', 'PuEr', 'Yellow', 'White', 'Oolong'];
      
      const infoTitles = document.querySelectorAll('.info-title');
      infoTitles.forEach(el => {
          if (el.textContent?.includes('Categories')) {
              const containerText = el.parentElement?.textContent || '';
              validTypes.forEach(t => {
                  if (containerText.includes(t)) {
                      type = t;
                  }
              });
          }
      });
      
      if (!type) {
           const bodyText = document.body.innerText;
           for (const t of validTypes) {
               if (bodyText.includes(t) && name.includes(t)) {
                   type = t;
                   break;
               }
           }
      }

      // 4. Steep Times
      const steepTimes: number[] = [];
      const bodyText = document.body.innerText;
      // Look for patterns like "10s"
      // We can try to be more specific or just grab all numbers followed by 's'
      const matches = bodyText.match(/(\d+)s/g);
      if (matches && matches.length > 2) {
          matches.forEach(m => {
              const num = parseInt(m.replace('s', ''));
              if (!isNaN(num) && num < 600) { // sanity check
                  steepTimes.push(num);
              }
          });
      }

      return { name, type, image, steepTimes };
    });

    await page.close(); // Only close the page, not the browser

    res.json(data);

  } catch (error: any) {
    if (page) await page.close();
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape URL', details: error.message });
  }
});

app.get('/api/teas', (req, res) => {
  try {
    const teas = readTeas();
    res.json(teas);
  } catch {
    res.status(500).json({ error: 'Failed to read teas' });
  }
});

app.post('/api/teas', (req, res) => {
  try {
    const teas = readTeas();
    const newTea = { ...req.body, id: Date.now().toString() };
    teas.push(newTea);
    writeTeas(teas);
    res.status(201).json(newTea);
  } catch {
    res.status(500).json({ error: 'Failed to save tea' });
  }
});

app.delete('/api/teas/:id', (req, res) => {
  try {
    const teas = readTeas();
    const filteredTeas = teas.filter(t => t.id !== req.params.id);
    writeTeas(filteredTeas);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete tea' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  // Pre-load the browser
  getBrowser()
    .then(() => console.log('Browser instance pre-loaded'))
    .catch(err => console.error('Failed to pre-load browser:', err));
});
