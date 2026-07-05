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

    // Prepare the prompt with Llama-style formatting instructions
    const fullPrompt = `${systemPrompt}

IMPORTANT: You MUST respond using this EXACT format:

1. Use [b]text[/b] for bold
2. Use [i]text[/i] for italic
3. For code blocks, use THREE backticks with language name:
   \`\`\`html
   your code here
   \`\`\`
4. NEVER use markdown (**bold**, *italic*, # headings)
5. Include spiritual emojis: 🕉️✨🌸💖🧿🌙☮️

EXAMPLE OF CORRECT RESPONSE:
Here's a [b]beautiful mantra[/b] for you:

[i]Let the light flow through your code[/i]

\`\`\`html
<div class="sacred-mantra">
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="gold"/>
  </svg>
</div>
\`\`\`

Remember: [b]bold[/b], [i]italic[/i], and triple backticks for code!

User question: ${userMessage}

Your response (using the format above):`;

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
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,  // Lower for more consistent formatting
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

    // Ensure code blocks are properly closed
    const backtickCount = (reply.match(/```/g) || []).length;
    if (backtickCount > 0 && backtickCount % 2 !== 0) {
      reply += '\n```';
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