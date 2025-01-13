const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const { URL } = require('url');
const fetch = require('node-fetch');
globalThis.fetch = fetch;

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
    const lighthouse = await import('lighthouse'); // Dynamically import Lighthouse
    const report = await runLighthouseTest(url, lighthouse);
    res.json(report);
  } catch (error) {
    console.error('Error running Lighthouse:', error.message);
    res.status(500).json({ error: 'Failed to run Lighthouse test.', details: error.message });
  }
});

async function runLighthouseTest(targetUrl, lighthouse) {
  const browser = await puppeteer.launch({ headless: true });
  const browserWSEndpoint = await browser.wsEndpoint();

  const lighthouseConfig = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['accessibility'], // Focus on accessibility category
  };

  const result = await lighthouse.default(targetUrl, {
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
