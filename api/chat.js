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
  'me', 'my', 'any', 'or', 'some', 'tell', 'help', 'give', 'good', 'best',
  'please', 'suggest', 'remedy', 'remedies', 'treatment'
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// Check if message is a simple conversational greeting
const GREETING_REGEX = /^(hi|hello|hey|namaste|namaskar|good\s+(morning|afternoon|evening)|pranam|vanakkam|who are you|what can you do|howdy|नमस्ते|प्रणाम|नमस्कार|నమస్కారం|నమస్తే|హలో)[\s!.,?।]*$/iu;

// BM25-style keyword search across knowledge chunks
function searchKnowledge(query, topK = 4) {
  const kb = getKnowledgeBase();
  if (!kb.length) return [];

  if (GREETING_REGEX.test(query.trim())) {
    return [];
  }

  const queryTerms = tokenize(query);
  const lowerQuery = query.toLowerCase();
  const topics = ['cough', 'cold', 'throat', 'headache', 'fever', 'digestion', 'gas', 'acidity', 'constipation', 'sleep', 'insomnia', 'turmeric', 'ginger', 'ashwagandha', 'tulsi', 'honey', 'vata', 'pitta', 'kapha', 'skin', 'joint', 'pain', 'backache'];

  const scored = kb.map(chunk => {
    const title = (chunk.title || '').toLowerCase();
    const text = (chunk.text || '').toLowerCase();
    let score = 0;

    for (const topic of topics) {
      if (lowerQuery.includes(topic)) {
        if (title.includes(topic)) score += 40;
        const matches = text.match(new RegExp('\\b' + topic, 'g'));
        if (matches) score += matches.length * 10;
      }
    }

    for (const term of queryTerms) {
      if (title.includes(term)) score += 6;
      const count = (text.match(new RegExp('\\b' + term + '\\b', 'g')) || []).length;
      score += Math.min(count, 4);
    }

    return {
      title: chunk.title,
      source: chunk.source,
      page: chunk.page,
      text: chunk.text,
      score
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, topK);
}

// Emergency red flag pattern
const URGENT_REGEX = /chest (pain|pressure|tightness)|heart attack|breathless|breathing (difficulty|trouble)|difficulty breathing|trouble breathing|shortness of breath|short of breath|unable to swallow|difficulty swallowing|bluish lips|blue lips|can.t breathe|cannot breathe|cough(ing)? up blood|unconscious|seizure|सीने में (दर्द|दबाव)|छाती में दर्द|साँस लेने में|सांस लेने में|निगल नहीं|नीले होंठ|बेहोश|दौरा|छाती में दबाव|छाती में जकड़न|छाती में जकड़न|saans (nahi|nahin)|seene (mein|me) dard|ఛాతి నొప్పి|ఛాతీ నొప్పి|ఛాతిలో నొప్పి|ఊపిరి ఆడ|శ్వాస తీసుకోవడ|మింగలేక|స్పృహ కోల్పో|ఫిట్స్/i;

// Fallback intelligent knowledge synthesizer
function localSynthesize(query, relevantChunks, lang = 'en', isEmergency = false) {
  if (isEmergency) {
    return {
      reply: lang === 'hi'
        ? `🚨 **अत्यंत आवश्यक सूचना (Emergency Alert):**\nसीने में तेज दर्द, सांस लेने में अत्यधिक कठिनाई या अचेत होना गंभीर चिकित्सीय आपात स्थिति के संकेत हो सकते हैं।\n\nकृपया तुरंत आपातकालीन सहायता प्राप्त करें या भारत में **112** पर कॉल करें। गंभीर आपात स्थितियों में घरेलू उपचार पर निर्भर न रहें।`
        : lang === 'te'
        ? `🚨 **అత్యవసర హెచ్చరిక (Emergency Alert):**\nతీవ్రమైన ఛాతీ నొప్పి, శ్వాస తీసుకోవడంలో తీవ్ర ఇబ్బంది అత్యవసర వైద్య పరిస్థితికి సంకేతాలు కావచ్చు.\n\nదయచేసి వెంటనే అత్యవసర వైద్య సహాయం పొందండి లేదా భారతదేశంలో **112** కు కాల్ చేయండి.`
        : `🚨 **EMERGENCY WARNING:**\nSudden severe chest pain, breathing difficulty, or unconsciousness can be signs of a medical emergency. Please seek urgent hospital care or dial **112** (Emergency Services in India) immediately. Do not rely on home self-care for acute emergencies.`
    };
  }

  if (GREETING_REGEX.test(query.trim())) {
    return {
      reply: lang === 'hi'
        ? `नमस्ते! **भारतवेदा AI (BharatVeda AI)** में आपका हार्दिक स्वागत है। 🌿\n\nमैं आपका प्रामाणिक आयुर्वेदिक स्वास्थ्य एवं जड़ी-बूटी ज्ञान साथी हूँ। मैं प्राचीन ग्रंथों (*द कम्पलीट बुक ऑफ आयुर्वेदिक होम रेमेडीज* एवं *एवरीडे आयुर्वेद*) के आधार पर आपके प्रश्नों का समाधान प्रस्तुत करता हूँ।\n\nआप मुझसे क्या पूछना चाहते हैं?\n* **सामान्य स्वास्थ्य समस्याएं:** खाँसी, जुकाम, अपच, एसिडिटी, नींद की कमी\n* **औषधीय पौधे व मसाले:** हल्दी, अदरक, अश्वगंधा, तुलसी, त्रिफला\n* **आयुर्वेदिक दिनचर्या व दोष संतुलन:** वात, पित्त, कफ एवं खान-पान के नियम`
        : lang === 'te'
        ? `నమస్కారం! **భారత్‌వేద AI (BharatVeda AI)** కి స్వాగతం. 🌿\n\nనేను మీ ఆయుర్వేద ఆరోగ్య మరియు మూలికా జ్ఞాన సహచరుడిని. ప్రాచీన ఆయుర్వేద గ్రంథాల ఆధారంగా మీ ప్రశ్నలకు సమాధానాలు ఇవ్వగలను.\n\nమీరు నన్ను వీటి గురించి అడగవచ్చు:\n* సాధారణ ఆరోగ్య సమస్యలు (దగ్గు, జలుబు, అజీర్ణం, నిద్రలేమి)\n* ఔషధ మొక్కలు & సుగంధ ద్రవ్యాలు (పసుపు, అల్లం, అశ్వగంధ, తులసి)\n* వాత, పిత్త, కఫ దోషాల సమతుల్యత మరియు దినచర్య`
        : `Namaste! Welcome to **BharatVeda AI**. 🌿\n\nI am your companion for authentic Indian herbal knowledge and classical Ayurvedic wisdom, drawn directly from revered texts including Dr. Vasant Lad’s *The Complete Book of Ayurvedic Home Remedies* and *Everyday Ayurveda*.\n\nHow may I help you today? You can ask about:\n* **Everyday Symptom Care:** Soothing a cough, digestive fire (Agni), acidity, sleep\n* **Medicinal Plants & Spices:** Turmeric (*Haridra*), Ginger (*Ardraka*), Ashwagandha, Tulsi\n* **Constitutional Harmony:** Balancing Vata, Pitta, or Kapha, daily routine (*Dinacharya*), and seasonal diet (*Ritucharya*)`
    };
  }

  if (!relevantChunks || !relevantChunks.length) {
    return {
      reply: lang === 'hi'
        ? `आयुर्वेद में स्वास्थ्य का आधार शरीर, मन और दोषों (वात, पित्त, कफ) का संतुलन है। अपने आहार में हल्का और सुपाच्य भोजन लें, गुनगुना पानी पिएं और दिनचर्या का पालन करें।\n\nकृपया अपने लक्षण या प्रश्न के बारे में थोड़ा और विस्तार से बताएं ताकि मैं उपयुक्त शास्त्रीय उपाय बता सकूं।`
        : `Ayurveda views health as harmony between constitutional doshas (Vata, Pitta, Kapha) and a strong digestive fire (*Agni*). For general well-being, sipping warm water, taking light freshly cooked meals, and maintaining regular daily rhythms are recommended.\n\nPlease describe your specific symptom or herbal inquiry so I can retrieve precise classical guidance for you.`
    };
  }

  // Synthesize an articulated response from classical references
  const mainChunk = relevantChunks[0];
  const excerpts = relevantChunks.slice(0, 3).map((c, i) =>
    `**${i + 1}. From *${c.source}* (Page ${c.page}):**\n${c.text.slice(0, 320)}...`
  ).join('\n\n');

  return {
    reply: `Here is the classical Ayurvedic guidance regarding **"${query}"** synthesized from our referenced texts:\n\n### 🌿 Traditional Ayurvedic Understanding & Remedies\n\n${excerpts}\n\n### ⚠️ Safety Precautions\n* Home remedies with culinary spices (such as ginger, turmeric, cumin, or honey) are intended for gentle, everyday self-care in mild conditions.\n* **Honey Caution:** Never add honey to boiling hot liquids or cook it, as Ayurveda considers heated honey toxic (*Ama*). Do not give honey to infants under 1 year old.\n* If symptoms persist beyond a few days or worsen, please consult a qualified Ayurvedic Vaidya or healthcare clinician.`
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-goog-api-key');

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

    const { message, context, lang = 'en', profile = null, apiKey: clientApiKey } = body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const cleanMessage = message.trim();
    const isGreeting = GREETING_REGEX.test(cleanMessage);
    const isEmergency = URGENT_REGEX.test(cleanMessage);

    // Retrieve knowledge base chunks
    let relevantChunks = [];
    if (!isGreeting) {
      relevantChunks = Array.isArray(context) && context.length > 0 ? context : searchKnowledge(cleanMessage, 4);
    }

    const sources = relevantChunks.map(c => ({
      title: c.title,
      source: c.source,
      page: c.page
    }));

    // Language guidelines
    const langInstructions = {
      en: 'Speak in warm, natural, and expressive English.',
      hi: 'स्वाभाविक, स्पष्ट और आत्मीय हिन्दी (Hindi) में उत्तर दें। आवश्यकतानुसार मुख्य शब्दों को कोष्ठक में अंग्रेजी में लिख सकते हैं।',
      te: 'సహజమైన, స్పష్టమైన మరియు ఆప్యాయతతో కూడిన తెలుగు (Telugu) లో సమాధానం ఇవ్వండి.'
    };
    const targetLang = ['en', 'hi', 'te'].includes(lang) ? lang : 'en';

    // System prompt synthesizing natural AI reasoning with classical Ayurvedic sources
    const systemPrompt = `You are BharatVeda AI, an articulate, empathetic, and culturally wise Ayurvedic companion designed for India.
You blend classical Indian botanical & Ayurvedic literature (from Dr. Vasant Lad's 'The Complete Book of Ayurvedic Home Remedies' and 'Everyday Ayurveda') with modern holistic health reasoning.

BEHAVIOR AND VOICE GUIDELINES:
1. TALK NATURALLY & CONVERSATIONALLY:
   - For greetings (e.g., "hi", "hello", "namaste", "good morning"): Respond warmly and cheerfully. Introduce yourself as BharatVeda AI, welcome the user, and ask what symptom, herb, or Ayurvedic topic they would like guidance on. Do NOT diagnose or give medical warnings on simple greetings.
   - For general Ayurvedic questions (e.g. doshas, daily routine dinacharya, diet): Explain the concept engagingly, weaving traditional wisdom with practical modern life.

2. COMBINE ARTICULATED REASONING WITH SOURCE TEXTS:
   - When a user asks about symptoms or health conditions, do NOT just quote raw text. Articulate the reasoning: explain the Ayurvedic physiology (e.g., how Vata creates dryness/irregularity, Pitta creates heat/inflammation, Kapha creates congestion/heaviness, and how digestive Agni/Ama plays a role).
   - Offer clear, actionable home remedies based on the provided classical literature (kitchen spices, herbs like ginger, turmeric, tulsi, cumin, black pepper, honey, ghee, etc.) with step-by-step preparation and dosage instructions.
   - Seamlessly credit the source texts (e.g., "According to Dr. Vasant Lad in *The Complete Book of Ayurvedic Home Remedies*...").

3. SAFETY & PRACTICAL PRECAUTIONS:
   - Provide sensible cautions gently (e.g., never heat honey in boiling water, exercise caution in pregnancy, avoid long-term unsupervised use).
   - Clearly state that remedies are for mild, everyday self-care.
   - ${isEmergency ? 'CRITICAL EMERGENCY: The user describes potential emergency symptoms (chest pain, severe breathlessness, etc.). State IMMEDIATELY with urgent clarity that they must seek emergency hospital care or call 112 in India right now.' : 'Advise seeing an Ayurvedic Vaidya or healthcare professional if symptoms persist or worsen.'}

4. LANGUAGE: ${langInstructions[targetLang]}
5. Keep responses well-articulated, nicely structured with readable paragraphs and bullet points, and avoid robotic boilerplate.`;

    const contextPrompt = relevantChunks.length > 0
      ? relevantChunks.map((c, i) => `[Source ${i + 1}: ${c.source} (Page ${c.page})]\nTopic: ${c.title}\nExcerpt: ${c.text}`).join('\n\n')
      : '';

    const userPrompt = `Patient Profile: ${profile ? `Name: ${profile.alias || 'Friend'}, Age: ${profile.age || 'Adult'}, Region: ${profile.district || 'India'}` : 'User'}
Preferred Language: ${targetLang}

User Message: "${cleanMessage}"

${contextPrompt ? `Classical Ayurvedic Texts Retrieved:
${contextPrompt}` : ''}

Please respond naturally and articulately according to the guidelines.`;

    // Attempt Gemini 3.6 Flash
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IQ6U2TZTWtG--6zgo0GpOO53y3qEnM8KcjyC7iPIU0FQ';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    try {
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
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 1000
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(geminiPayload)
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const replyText = candidate?.content?.parts?.[0]?.text;
        if (replyText) {
          return res.status(200).json({
            reply: replyText,
            sources,
            isEmergency,
            model: 'gemini-3.6-flash'
          });
        }
      } else {
        const errText = await response.text();
        console.warn('Gemini API call non-200:', response.status, errText);
      }
    } catch (apiErr) {
      console.warn('Gemini call error:', apiErr.message);
    }

    // High quality intelligent Ayurvedic synthesis fallback (guarantees natural response even if external API key is invalid/expired)
    const fallback = localSynthesize(cleanMessage, relevantChunks, targetLang, isEmergency);
    return res.status(200).json({
      reply: fallback.reply,
      sources,
      isEmergency,
      model: 'BharatVeda Ayurvedic Knowledge Engine (Classical Texts)'
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
};
