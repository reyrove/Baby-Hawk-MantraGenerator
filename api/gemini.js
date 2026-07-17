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

    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

    const model = 'gemini-3.1-flash-lite';
    
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
              text: `${systemPrompt}\n\nUser: ${userMessage}`
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google API Error:', data);
      throw new Error(data.error?.message || 'Google API error');
    }

    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  "Baby Hawk is in deep meditation... 🧘‍♀️✨";

    // Remove markdown formatting: asterisks (*) and hashes (#)
    reply = reply
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold (**text**)
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic (*text*)
      .replace(/### (.*?)(\n|$)/g, '$1$2')  // Remove ### headings
      .replace(/## (.*?)(\n|$)/g, '$1$2')   // Remove ## headings
      .replace(/# (.*?)(\n|$)/g, '$1$2')    // Remove # headings
      .replace(/^[#*]+\s*/gm, '')       // Remove any leading # or * at start of lines
      .replace(/\n{3,}/g, '\n\n')       // Replace 3+ newlines with 2
      .trim();

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