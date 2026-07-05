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

⚠️ IMPORTANT - YOU MUST OUTPUT CODE IN THIS EXACT FORMAT:

When you provide code, you MUST wrap it in triple backticks with the language name like this:

\`\`\`html
<div class="mantra">Your code here</div>
\`\`\`

This is REQUIRED. Without the triple backticks, the user cannot see the code properly.

Examples of valid code blocks:
\`\`\`html
<!-- HTML code -->
\`\`\`

\`\`\`css
/* CSS code */
\`\`\`

\`\`\`js
// JavaScript code
\`\`\`

For bold text, use [b]text[/b]
For italic text, use [i]text[/i]
NEVER use markdown (**bold**, *italic*, # headings)
Always include spiritual emojis: 🕉️✨🌸💖🧿🌙☮️

Now, please respond to the user's question using [b]bold[/b] and [i]italic[/i] for formatting, and code blocks with triple backticks for any code.

User question: ${userMessage}

Your response:`;

    // Use Gemini 3.5 Flash
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

    // Log the response for debugging (will show in Vercel logs)
    console.log('Raw Gemini Response Length:', reply.length);
    console.log('Contains backticks:', reply.includes('```'));
    console.log('Contains code block:', /```[\s\S]*?```/.test(reply));

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