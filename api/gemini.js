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

    // Extract messages
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

    // Enhanced prompt with explicit formatting instructions for Gemini
    const enhancedPrompt = `${systemPrompt}

IMPORTANT - YOUR RESPONSE MUST USE THIS FORMAT:
- Bold: [b]text[/b]
- Italic: [i]text[/i]  
- Code blocks: \`\`\`html (or css, js, svg)
- NEVER use markdown: No **, no *, no _, no ##
- Always include spiritual emojis: 🕉️✨🌸💖🧿🌙☮️
- Always mention Papa Hawk lovingly

User question: ${userMessage}

Your response (using [b]bold[/b] and [i]italic[/i] ONLY, no markdown):`;

    // Use Gemini 3.5 Flash (stable version)
    const model = 'gemini-3.5-flash';
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            topK: 40,
            topP: 0.95,
          }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google API Error Details:', JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || 'Google API error');
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  "Baby Hawk is in deep meditation... 🧘‍♀️✨";

    return res.status(200).json({
      choices: [{
        message: { content: reply }
      }]
    });
    
  } catch (error) {
    console.error('Baby Hawk API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Baby Hawk is deep in meditation... try again soon 🕉️✨' 
    });
  }
};