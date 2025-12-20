// Vercel Serverless Function for NSFW Content Moderation
// Compatible with ButoSha image bed

const express = require('express');
const fetch = require('node-fetch');
const nsfwjs = require('./dist/cjs/index');

const app = express();
let model;

// Load model on first request
const loadModel = async () => {
  if (!model) {
    model = await nsfwjs.load();
    console.log('NSFW model loaded successfully');
  }
};

// API endpoint for ButoSha compatibility
app.get('/', async (req, res) => {
  try {
    await loadModel();
    
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
    
    // Fetch the image from URL
    const imageResponse = await fetch(url, {
      timeout: 10000 // 10 second timeout
    });
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    // Classify image
    const imageBuffer = await imageResponse.buffer();
    const predictions = await model.classify(imageBuffer);
    
    // Calculate score (compatible with ButoSha)
    let score = 0;
    predictions.forEach(pred => {
      if (pred.className === 'Porn' || pred.className === 'Hentai') {
        score += pred.probability;
      }
    });
    score = Math.min(1, score);
    
    // Map to ButoSha labels
    let label = 'None';
    if (score >= 0.9) {
      label = 'adult';
    } else if (score >= 0.7) {
      label = 'teen';
    } else {
      label = 'everyone';
    }
    
    res.json({ score, label });
  } catch (error) {
    console.error('NSFW Moderation Error:', error);
    // Return safe default on error to prevent upload failure
    res.json({ score: 0, label: 'None' });
  }
});

// For ButoSha compatibility - return just the label
app.get('/classify', async (req, res) => {
  const result = await app._router.handle(req, res, () => {});
  if (result && result.label) {
    res.json({ label: result.label });
  } else {
    res.json({ label: 'None' });
  }
});

module.exports = app;
