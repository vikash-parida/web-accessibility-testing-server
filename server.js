import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath
import fetch from 'node-fetch';      // Polyfill fetch
globalThis.fetch = fetch;           // Assign fetch globally
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';

// Define __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Serve React build files
app.use(express.static(path.join(__dirname, '../client/build')));

// API endpoint for Lighthouse testing
app.get('/api/test-lighthouse', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required.' });
  }

  try {
    const report = await runLighthouseTest(url);
    res.json(report);
  } catch (error) {
    console.error('Error running Lighthouse:', error.message);
    res.status(500).json({ error: 'Failed to run Lighthouse test.', details: error.message });
  }
});

async function runLighthouseTest(targetUrl) {
  const browser = await puppeteer.launch({ headless: true });
  const browserWSEndpoint = await browser.wsEndpoint();

  const lighthouseConfig = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['accessibility'], // Focus on accessibility category
  };

  const result = await lighthouse(targetUrl, {
    port: new URL(browserWSEndpoint).port,
    ...lighthouseConfig,
  });

  await browser.close();

  return JSON.parse(result.report);
}

// Fallback for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
