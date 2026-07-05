const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    // Extract the user's message from the messages array
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    
    // Get system prompt from messages
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

    // Format for Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser: ${userMessage}\n\nBaby Hawk:`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Google API error');
    }

    // Extract the response text from Gemini's format
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  "Baby Hawk is in deep meditation... 🧘‍♀️✨";

    // Format response to match what your frontend expects
    return res.status(200).json({
      choices: [{
        message: {
          content: reply
        }
      }]
    });
    
  } catch (error) {
    console.error('Baby Hawk API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Baby Hawk is deep in meditation... try again soon 🕉️✨' 
    });
  }
};