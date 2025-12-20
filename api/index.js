// Vercel Serverless Function for NSFW Content Moderation
// Compatible with ButoSha image bed

const nsfwjs = require('nsfwjs');
const fetch = require('node-fetch');

let model;

// Load model on first request
const loadModel = async () => {
  if (!model) {
    // Load NSFW model
    model = await nsfwjs.load();
    console.log('NSFW model loaded successfully');
  }
};

// API endpoint for ButoSha compatibility
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get URL parameter
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
    
    // Load model
    await loadModel();
    
    // Fetch the image from URL
    const imageResponse = await fetch(url, {
      timeout: 10000 // 10 second timeout
    });
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    // Convert to buffer and classify
    const imageBuffer = await imageResponse.buffer();
    const predictions = await model.classify(imageBuffer);
    
    // Calculate score for ButoSha compatibility
    let score = 0;
    predictions.forEach(pred => {
      if (pred.className === 'Porn' || pred.className === 'Hentai') {
        score += pred.probability;
      }
    });
    score = Math.min(1, score);
    
    // Determine label based on score
    let label = 'None';
    if (score >= 0.9) {
      label = 'adult';
    } else if (score >= 0.7) {
      label = 'teen';
    } else {
      label = 'everyone';
    }
    
    // Return result
    res.status(200).json({ score, label });
  } catch (error) {
    console.error('NSFW Moderation Error:', error);
    
    // Return safe default to prevent upload failures
    res.status(200).json({ score: 0, label: 'None' });
  }
};
