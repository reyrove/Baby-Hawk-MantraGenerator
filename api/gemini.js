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

    // Use Interactions API (recommended for Gemini 3.5 Flash)
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
              text: `${systemPrompt}\n\nUser: ${userMessage}\n\nBaby Hawk:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            topP: 0.95,
            topK: 40,
          }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google API Error Details:', JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || 'Google API error');
    }

    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  "Baby Hawk is in deep meditation... 🧘‍♀️✨";

    // If Gemini doesn't use proper code blocks, force format them
    // Check if the response has code-like content but without proper formatting
    if (!reply.includes('```') && (reply.includes('div') || reply.includes('svg') || reply.includes('html') || reply.includes('css') || reply.includes('js'))) {
      // Try to extract code from the response
      const codeMatch = reply.match(/(?:<|{|\(|function|class|import|const|let|var|div|svg|html|css|body)/i);
      if (codeMatch) {
        // Find where code might start
        const codeStart = reply.indexOf(codeMatch[0]);
        if (codeStart > 0) {
          const beforeCode = reply.substring(0, codeStart);
          const codeContent = reply.substring(codeStart);
          // Wrap the code in proper code blocks
          reply = beforeCode + '\n\n```html\n' + codeContent.trim() + '\n```';
        }
      }
    }

    console.log('Response length:', reply.length);
    console.log('Has code block:', reply.includes('```'));

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