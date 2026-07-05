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

    // Try multiple models in order
    const modelsToTry = [
      'gemini-1.5-pro',
      'gemini-1.5-flash', 
      'gemini-pro',
      'gemini-1.0-pro',
      'text-bison-001'
    ];

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Attempting model: ${model}`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
          }
        );

        const data = await response.json();
        
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.log(`Success with model: ${model}`);
          const reply = data.candidates[0].content.parts[0].text;
          
          return res.status(200).json({
            choices: [{ message: { content: reply } }]
          });
        }
        
        lastError = data.error?.message || 'Model returned invalid response';
        console.log(`Model ${model} failed:`, lastError);
        
      } catch (error) {
        lastError = error.message;
        console.log(`Model ${model} threw error:`, lastError);
      }
    }

    // If all models fail
    throw new Error(`All models failed. Last error: ${lastError}`);

  } catch (error) {
    console.error('Baby Hawk API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Baby Hawk is deep in meditation... try again soon 🕉️✨' 
    });
  }
};