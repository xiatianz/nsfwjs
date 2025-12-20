// Vercel Serverless Function for NSFW Content Moderation
// Compatible with ButoSha image bed

const { load } = require('nsfwjs');
const fetch = require('node-fetch');

let model;

// Load model on first request
const loadModel = async () => {
  if (!model) {
    model = await load();
    console.log('NSFW model loaded successfully');
  }
};

// Main classification function
const classifyImage = async (url) => {
  await loadModel();
  
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
  
  return { score, label };
};

// API endpoint for ButoSha compatibility
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
    
    const result = await classifyImage(url);
    
    // Handle different endpoints
    if (req.url.startsWith('/classify')) {
      return res.json({ label: result.label });
    }
    
    return res.json(result);
  } catch (error) {
    console.error('NSFW Moderation Error:', error);
    // Return safe default on error to prevent upload failure
    
    // Handle different endpoints
    if (req.url.startsWith('/classify')) {
      return res.json({ label: 'None' });
    }
    
    return res.json({ score: 0, label: 'None' });
  }
};
