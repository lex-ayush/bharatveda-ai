const fs = require('fs');
const path = require('path');

// Read knowledge base once in memory
let knowledgeBase = null;
function getKnowledgeBase() {
  if (!knowledgeBase) {
    try {
      const kbPath = path.join(process.cwd(), 'knowledge_base.json');
      if (fs.existsSync(kbPath)) {
        knowledgeBase = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to load knowledge_base.json:', e);
    }
  }
  return knowledgeBase || [];
}

// Tokenizer & stop words for server-side hybrid retrieval
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'how', 'why', 'can', 'i', 'do', 'should', 'about',
  'me', 'my', 'any', 'or', 'some', 'tell', 'help', 'give', 'good', 'best'
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// BM25-style keyword search across knowledge chunks
function searchKnowledge(query, topK = 4) {
  const kb = getKnowledgeBase();
  if (!kb.length) return [];

  const queryTerms = tokenize(query);
  if (!queryTerms.length) return kb.slice(0, topK);

  const scored = kb.map(chunk => {
    const title = (chunk.title || '').toLowerCase();
    const text = (chunk.text || '').toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      // Title match gets a high boost
      if (title.includes(term)) score += 5;
      // Exact word matches in text
      const count = (text.match(new RegExp('\\b' + term + '\\b', 'g')) || []).length;
      score += Math.min(count, 4);
    }

    // Boost common Ayurvedic terms
    const lowerQuery = query.toLowerCase();
    if ((lowerQuery.includes('cough') || lowerQuery.includes('cold')) && (text.includes('cough') || text.includes('cold') || text.includes('ginger'))) score += 3;
    if (lowerQuery.includes('turmeric') && text.includes('turmeric')) score += 3;
    if (lowerQuery.includes('ginger') && text.includes('ginger')) score += 3;
    if (lowerQuery.includes('ashwagandha') && text.includes('ashwagandha')) score += 3;
    if (lowerQuery.includes('pitta') && text.includes('pitta')) score += 3;
    if (lowerQuery.includes('vata') && text.includes('vata')) score += 3;
    if (lowerQuery.includes('kapha') && text.includes('kapha')) score += 3;
    if (lowerQuery.includes('sleep') && (text.includes('sleep') || text.includes('insomnia'))) score += 3;
    if (lowerQuery.includes('digestion') && (text.includes('digestion') || text.includes('agni'))) score += 3;

    return {
      title: chunk.title,
      source: chunk.source,
      page: chunk.page,
      text: chunk.text,
      score
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// Emergency red flag pattern
const URGENT_REGEX = /chest (pain|pressure|tightness)|heart attack|breathless|breathing (difficulty|trouble)|difficulty breathing|trouble breathing|shortness of breath|short of breath|unable to swallow|difficulty swallowing|bluish lips|blue lips|can.t breathe|cannot breathe|cough(ing)? up blood|unconscious|seizure|सीने में (दर्द|दबाव)|छाती में दर्द|साँस लेने में|सांस लेने में|निगल नहीं|नीले होंठ|बेहोश|दौरा|छाती में दबाव|छाती में जकड़न|छाती में जकड़न|saans (nahi|nahin)|seene (mein|me) dard|ఛాతి నొప్పి|ఛాతీ నొప్పి|ఛాతిలో నొప్పి|ఊపిరి ఆడ|శ్వాస తీసుకోవడ|మింగలేక|స్పృహ కోల్పో|ఫిట్స్/i;

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { message, context, lang = 'en', profile = null } = body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const cleanMessage = message.trim();

    // Check emergency red flags
    const isEmergency = URGENT_REGEX.test(cleanMessage);

    // Retrieve knowledge base chunks (use client context if provided, otherwise server search)
    let relevantChunks = Array.isArray(context) && context.length > 0 ? context : searchKnowledge(cleanMessage, 4);

    // Format context for prompt
    const contextPrompt = relevantChunks.map((c, i) =>
      `[Document ${i + 1}: ${c.source} (Page ${c.page})]\nTopic: ${c.title}\nContent: ${c.text}`
    ).join('\n\n');

    // Language guidelines
    const langInstructions = {
      en: 'Respond in clear, accessible English.',
      hi: 'उत्तर सरल और स्पष्ट हिन्दी (Hindi) में दें। यदि आवश्यक हो तो अंग्रेजी शब्दों को कोष्ठक में लिख सकते हैं।',
      te: 'సమాధానాన్ని స్పష్టమైన తెలుగు (Telugu) లో ఇవ్వండి. అవసరమైతే ఆంగ్ల పదాలను బ్రాకెట్లలో ఉంచవచ్చు.'
    };

    const targetLang = ['en', 'hi', 'te'].includes(lang) ? lang : 'en';

    // System prompt
    const systemPrompt = `You are BharatVeda AI, an intelligent, empathetic, and culturally rooted Ayurvedic health knowledge assistant designed for India.
You provide educational guidance rooted in classical Indian botanical and Ayurvedic traditions (from texts like 'The Complete Book of Ayurvedic Home Remedies' by Dr. Vasant Lad and 'Everyday Ayurveda').

GUIDELINES:
1. Base your remedies and advice on the provided Classical Ayurvedic Knowledge excerpts.
2. Structure your response clearly:
   - Plain-language explanation of the condition from an Ayurvedic perspective (e.g., Dosha involved: Vata, Pitta, or Kapha).
   - Practical, safe home remedies or herbal preparations mentioned in the texts (with simple kitchen spices/herbs like ginger, turmeric, black pepper, honey, tulsi, cumin).
   - Clear precautions: emphasize that herbal remedies are for mild, everyday self-care. Note contraindications (e.g., avoid honey in boiling water, do not give honey to infants under 1 year old, consult a doctor if pregnant, elderly, or on medication).
3. If the user mentions warning signs, or if symptoms are severe/persistent: advise consulting an Ayurvedic Vaidya or healthcare professional immediately.
4. ${isEmergency ? 'URGENT: This query mentions potential emergency symptoms. Immediately state that for chest pain, breathing difficulty, or severe distress, they should seek emergency medical care or call 112 in India immediately.' : ''}
5. ${langInstructions[targetLang]}
6. Keep the response friendly, grounded, and concise (under 200-250 words) so it is easy to read on mobile devices.`;

    const userPrompt = `Patient Details: ${profile ? `Name: ${profile.alias || 'Guest'}, Age: ${profile.age || 'Adult'}, District: ${profile.district || 'India'}` : 'Adult User'}
Language: ${targetLang}

User Inquiry: "${cleanMessage}"

Classical Ayurvedic Knowledge Retrieved from Books:
${contextPrompt}

Please provide an educational, Ayurvedic response following the guidelines above.`;

    // API Key from environment or fallback
    const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IQ6U2TZTWtG--6zgo0GpOO53y3qEnM8KcjyC7iPIU0FQ';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 1000
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', response.status, errText);
      return res.status(502).json({
        error: 'Failed to contact Gemini AI',
        details: errText
      });
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const replyText = candidate?.content?.parts?.[0]?.text || 'No response generated.';

    const sources = relevantChunks.map(c => ({
      title: c.title,
      source: c.source,
      page: c.page
    }));

    return res.status(200).json({
      reply: replyText,
      sources,
      isEmergency,
      model: 'gemini-3.6-flash'
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
};
