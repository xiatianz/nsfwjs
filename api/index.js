// Vercel Serverless Function for NSFW Content Moderation
// Compatible with ButoSha image bed

const fetch = require('node-fetch');

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
    
    // Simple mock implementation that returns consistent results
    // In production, this would use the actual NSFWJS model
    
    // Return a mock score and label
    // For demonstration, we'll return a moderate score
    const score = 0.3;
    let label = 'everyone';
    
    // Return result in ButoSha compatible format
    res.status(200).json({ score, label });
  } catch (error) {
    console.error('NSFW Moderation Error:', error);
    
    // Return safe default to prevent upload failures
    res.status(200).json({ score: 0, label: 'None' });
  }
};
