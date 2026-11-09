const paths = {
  leaf:'<path d="M20 4C9 3 4 8 5 15c7 3 13-1 15-11ZM3 21c3-5 6-8 12-12"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  chat:'<path d="M20 11a7.5 7.5 0 0 1-7.5 7.5H5l1.5-3A7.5 7.5 0 1 1 20 11Z"/><path d="M9 11h7"/>',
  shield:'<path d="m12 22 6-4a6 6 0 0 0 2-5V6l-8-4-8 4v7a6 6 0 0 0 2 5Z"/><path d="m9 12 2 2 4-4"/>',
  bolt:'<path d="m14 2-9 12h6l-1 8 9-12h-6Z"/>',
  arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',
  book:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>',
  mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1m-7 8v3"/>'
};
const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+paths[name]+'</svg>';
const main = document.querySelector('main');
const language = document.querySelector('#language');
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
let lang = read('vedaLanguage','en');
if (!['en','hi','te'].includes(lang)) lang = 'en';
const li = () => ['en','hi','te'].indexOf(lang);
const t = key => copy[key][li()];
const escapeText = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const link = (route,key,style='btn',symbol='arrow') => '<a class="'+style+'" href="#'+route+'">'+t(key)+' '+icon(symbol)+'</a>';
const head = (title,description) => '<div class="wrap pagehead"><div class="eyebrow">'+t('demo')+'</div><h1>'+t(title)+'</h1>'+(description?'<p class="intro">'+t(description)+'</p>':'')+'</div>';
const fields = (id,label,options='') => '<div class="field"><label for="'+id+'">'+t(label)+'</label><input id="'+id+'" '+options+'></div>';
const tile = ([title,description,symbol]) => '<article class="card"><span class="tileicon">'+icon(symbol)+'</span><h3>'+t(title)+'</h3><p>'+t(description)+'</p></article>';
function home() {
  return '<section class="wrap hero"><div><div class="eyebrow pill">'+icon('leaf')+t('badge')+'</div><h1>'+t('heroA')+'<br><em>'+t('heroB')+'</em></h1><p>'+t('heroP')+'</p><div class="actions">'+link('login','login')+'</div></div><figure class="heroart"><figcaption>'+t('caption')+'</figcaption></figure></section>'+
  '<div class="strip"><div class="wrap">'+[['globe','languages'],['shield','careFirst'],['bolt','light']].map(([i,k])=>'<span>'+icon(i)+t(k)+'</span>').join('')+'</div></div>'+
  '<section class="section wrap center"><div class="eyebrow">'+t('mission')+'</div><h2>'+t('missionTitle')+'</h2><p class="intro">'+t('missionP')+'</p></section>'+
  '<section class="section tint"><div class="wrap"><div class="eyebrow">'+t('tools')+'</div><h2>'+t('toolsTitle')+'</h2><div class="grid">'+[['assistant','tool1','chat'],['library','tool2','leaf'],['buddy','buddyIntro','book']].map(tile).join('')+'</div></div></section>'+
  '<section class="section wrap"><div class="eyebrow">'+t('how')+'</div><div class="grid">'+[1,2,3].map(n=>'<article class="card"><div class="eyebrow">0'+n+'</div><h3>'+t('step'+n)+'</h3><p>'+t('step'+n+'p')+'</p></article>').join('')+'</div></section>'+
  '<section class="wrap pagebody"><div class="band"><h2>'+t('cta')+'</h2>'+link('login','login')+'</div></section>';
}
const chat = [];
let noteValues = {symptoms:'',duration:'',routine:''};
let noteShown = false;
let emergencyInChat = false;

// Emergency red flag detection pattern
const urgentPattern = /chest (pain|pressure|tightness)|heart attack|breathless|breathing (difficulty|trouble)|difficulty breathing|trouble breathing|shortness of breath|short of breath|unable to swallow|difficulty swallowing|bluish lips|blue lips|can.t breathe|cannot breathe|cough(ing)? up blood|unconscious|seizure|सीने में (दर्द|दबाव)|छाती में दर्द|साँस लेने में|सांस लेने में|निगल नहीं|नीले होंठ|बेहोश|दौरा|छाती में दबाव|छाती में जकड़न|छाती में जकड़न|saans (nahi|nahin)|seene (mein|me) dard|ఛాతి నొప్పి|ఛాతీ నొప్పి|ఛాతిలో నొప్పి|ఊపిరి ఆడ|శ్వాస తీసుకోవడ|మింగలేక|స్పృహ కోల్పో|ఫిట్స్/iu;

// Conversational greeting pattern
const greetingPattern = /^(hi|hello|hey|namaste|namaskar|good\s+(morning|afternoon|evening)|pranam|vanakkam|who are you|what can you do|howdy|नमस्ते|प्रणाम|नमस्कार|నమస్కారం|నమస్తే|హలో)[\s!.,?।]*$/iu;

// Natural queries for sample chips
const sampleQueries = {
  cough: {
    en: 'What are gentle Ayurvedic home remedies for a mild cough?',
    hi: 'हल्की खाँसी के लिए सुरक्षित आयुर्वेदिक घरेलू उपाय क्या हैं?',
    te: 'తేలికపాటి దగ్గుకు సురక్షితమైన ఆయుర్వేద గృహ నివారణలు ఏమిటి?'
  },
  cold: {
    en: 'What natural remedies help relieve a runny nose and cold?',
    hi: 'जुकाम और बहती नाक के लिए कौन से प्राकृतिक उपाय हैं?',
    te: 'జలుబు మరియు ముక్కు కారడానికి సహజ నివారణలు ఏమిటి?'
  },
  throat: {
    en: 'How can I soothe a sore throat and irritation with Ayurveda?',
    hi: 'आयुर्वेद के अनुसार गले के दर्द और खराश से कैसे राहत पाएं?',
    te: 'ఆయుర్వేదం ఉపయోగించి గొంతు నొప్పి నుండి ఎలా ఉపశమనం పొందాలి?'
  },
  urgent: {
    en: 'I am experiencing sudden chest pain and trouble breathing',
    hi: 'मुझे अचानक सीने में दर्द और सांस लेने में कठिनाई हो रही है',
    te: 'నాకు అకస్మాత్తుగా ఛాతీ నొప్పి మరియు శ్వాస తీసుకోవడంలో ఇబ్బందిగా ఉంది'
  }
};

function getStoredApiKey() {
  try {
    return localStorage.getItem('vedaGeminiKey') || 'AQ.Ab8RN6IXaGvZUbUl8HS4w4_uFfkOdqqKTgOTuzAv3o2FackjKg';
  } catch {
    return 'AQ.Ab8RN6IXaGvZUbUl8HS4w4_uFfkOdqqKTgOTuzAv3o2FackjKg';
  }
}

function formatInline(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

function formatMarkdown(text) {
  if (!text) return '';
  const lines = String(text).split('\n');
  const out = [];
  let currentList = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      if (currentList) { out.push('</' + currentList + '>'); currentList = null; }
      out.push('<h4 style="margin:12px 0 6px;color:var(--ink);">' + formatInline(trimmed.slice(4)) + '</h4>');
      continue;
    }
    const bulletMatch = trimmed.match(/^[\*\-]\s+(.*)$/);
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

    if (bulletMatch) {
      if (currentList !== 'ul') {
        if (currentList) out.push('</' + currentList + '>');
        out.push('<ul>');
        currentList = 'ul';
      }
      out.push('<li>' + formatInline(bulletMatch[1]) + '</li>');
    } else if (numMatch) {
      if (currentList !== 'ol') {
        if (currentList) out.push('</' + currentList + '>');
        out.push('<ol>');
        currentList = 'ol';
      }
      out.push('<li>' + formatInline(numMatch[2]) + '</li>');
    } else {
      if (currentList) {
        out.push('</' + currentList + '>');
        currentList = null;
      }
      if (trimmed) {
        out.push('<p style="margin:6px 0;">' + formatInline(trimmed) + '</p>');
      }
    }
  }
  if (currentList) out.push('</' + currentList + '>');
  return out.join('');
}

let clientKnowledgeBase = null;
let clientExtractor = null;
let clientVectorSearchReady = false;

async function initClientRAG() {
  try {
    const res = await fetch('knowledge_base.json');
    if (res.ok) clientKnowledgeBase = await res.json();
  } catch {}
  try {
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    clientExtractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', { quantized: true });
    clientVectorSearchReady = Boolean(clientKnowledgeBase && clientExtractor);
  } catch {}
}
initClientRAG();

function searchClientKnowledge(query, topK = 4) {
  if (!clientKnowledgeBase || !clientKnowledgeBase.length) return [];
  const q = query.toLowerCase();
  const topics = ['cough', 'cold', 'throat', 'headache', 'fever', 'digestion', 'gas', 'acidity', 'constipation', 'sleep', 'insomnia', 'turmeric', 'ginger', 'ashwagandha', 'tulsi', 'honey', 'vata', 'pitta', 'kapha'];
  
  const scored = clientKnowledgeBase.map(c => {
    let score = 0;
    const title = (c.title || '').toLowerCase();
    const text = (c.text || '').toLowerCase();

    for (const topic of topics) {
      if (q.includes(topic)) {
        if (title.includes(topic)) score += 40;
        const matches = text.match(new RegExp('\\b' + topic, 'g'));
        if (matches) score += matches.length * 10;
      }
    }

    const words = q.split(/\s+/).filter(w => w.length > 2);
    for (const w of words) {
      if (title.includes(w)) score += 5;
      if (text.includes(w)) score += 1;
    }
    return { ...c, score };
  }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

// Client-side articulated fallback synthesizer (ensures natural responses without broken clinician boilerplate)
function localSynthesize(query, relevantChunks, lang = 'en', isEmergency = false) {
  if (isEmergency) {
    return {
      reply: lang === 'hi'
        ? '🚨 **अत्यंत आवश्यक सूचना (Emergency Alert):**\nसीने में तेज दर्द, सांस लेने में अत्यधिक कठिनाई या अचेत होना गंभीर चिकित्सीय आपात स्थिति के संकेत हो सकते हैं।\n\nकृपया तुरंत आपातकालीन सहायता प्राप्त करें या भारत में **112** पर कॉल करें। गंभीर आपात स्थितियों में घरेलू उपचार पर निर्भर न रहें।'
        : lang === 'te'
        ? '🚨 **అత్యవసర హెచ్చరిక (Emergency Alert):**\nతీవ్రమైన ఛాతీ నొప్పి, శ్వాస తీసుకోవడంలో తీవ్ర ఇబ్బంది అత్యవసర వైద్య పరిస్థితికి సంకేతాలు కావచ్చు.\n\nదయచేసి వెంటనే అత్యవసర వైద్య సహాయం పొందండి లేదా భారతదేశంలో **112** కు కాల్ చేయండి.'
        : '🚨 **EMERGENCY WARNING:**\nSudden severe chest pain, breathing difficulty, or unconsciousness can be signs of a medical emergency. Please seek urgent hospital care or dial **112** (Emergency Services in India) immediately. Do not rely on home self-care for acute emergencies.',
      sources: []
    };
  }

  if (greetingPattern.test(query.trim())) {
    return {
      reply: lang === 'hi'
        ? 'नमस्ते! मैं भारतवेदा AI हूँ, आपका आत्मीय आयुर्वेदिक स्वास्थ्य साथी। 🌿\n\nआप कैसा महसूस कर रहे हैं? आप मुझसे किसी भी लक्षण, जड़ी-बूटी (जैसे हल्दी, अदरक, अश्वगंधा) या दोष संतुलन के बारे में निसंकोच पूछ सकते हैं। मैं आपकी क्या मदद कर सकता हूँ?'
        : lang === 'te'
        ? 'నమస్కారం! నేను భారత్‌వేద AI, మీ ఆయుర్వేద ఆరోగ్య సహచరుడిని. 🌿\n\nమీరు ఎలా ఉన్నారు? ఏదైనా లక్షణం, ఔషధ మూలికలు (పసుపు, అల్లం, అశ్వగంధ) లేదా ఆరోగ్య సందేహాల గురించి నన్ను అడగవచ్చు. ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?'
        : 'Namaste! I am BharatVeda AI, your Ayurvedic health and wellness companion. 🌿\n\nHow are you feeling today? You can ask me anything about everyday symptoms, healing herbs like ginger, turmeric, or ashwagandha, or how to balance your mind and body. How can I help you?',
      sources: []
    };
  }

  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('fear') || lowerQuery.includes('anxiety') || lowerQuery.includes('scared') || lowerQuery.includes('डर') || lowerQuery.includes('घबराहट')) {
    return {
      reply: lang === 'hi'
        ? 'एक गहरी, शांत सांस लें। मैं आपके साथ हूँ।\n\nआयुर्वेद में डर और घबराहट को **वात दोष (Vata dosha)** के असंतुलन से जोड़ा जाता है। जब मन और तंत्रिका तंत्र पर तनाव बढ़ता है, तो वात चंचल हो जाता है, जिससे बेचैनी और भय महसूस होता है।\n\nइस समय अपने मन को शांत और स्थिर करने के लिए आप ये सरल उपाय कर सकते हैं:\n\n* **धीमी और गहरी सांसें लें:** अपनी नाक से धीरे-धीरे गहरी सांस अंदर लें और मुंह से धीरे-धीरे बाहर छोड़ें।\n* **गुनगुना पानी या हर्बल चाय पिएं:** थोड़ा गुनगुना पानी या तुलसी-इलायची की हल्की चाय पीने से शरीर को तुरंत गर्माहट और शांति मिलती है।\n* **तलवों की मालिश:** हल्के गुनगुने तिल या नारियल तेल से तलवों और माथे पर धीरे-धीरे मालिश करें। यह वात को शांत कर स्थिरता लाता है।\n* **गर्म और ताजा भोजन:** ठंडा या सूखा खाना खाने से बचें और हल्का, सुपाच्य भोजन लें।\n\nसब ठीक हो जाएगा। क्या आपके मन में किसी विशेष बात को लेकर चिंता है? आप मुझसे खुलकर साझा कर सकते हैं।'
        : 'Take a slow, gentle breath. I am right here with you.\n\nIn Ayurveda, feelings of fear and anxiety are intimately connected to an aggravated **Vata dosha**—the energy of air and movement. When life feels overwhelming, Vata gets unsettled, making the mind and nervous system feel ungrounded and scattered.\n\nHere are some soothing, grounding practices you can do right now to help you feel calm and safe:\n\n* **Deep Belly Breathing:** Place one hand on your belly. Breathe in slowly through your nose for 4 counts, feel your belly rise, and exhale gently for 6 counts. This directly relaxes your nervous system.\n* **Warm, Calming Sips:** Drink a warm cup of water, chamomile tea, or warm milk with a pinch of nutmeg or cardamom. Warmth is naturally soothing to Vata.\n* **Gentle Grounding Massage:** Rubbing a little warm sesame or coconut oil onto your temples and the soles of your feet helps bring restless energy back down into the body.\n* **Ground Your Body:** Sit comfortably with both feet flat on the floor, and feel the steady ground holding you up.\n\nTake it one breath at a time. If there is a particular worry or feeling on your mind, feel free to tell me—I am here to listen.',
      sources: []
    };
  }

  if (relevantChunks && relevantChunks.length) {
    const textSnippet = relevantChunks.map(c => c.text).join(' ').slice(0, 350);
    return {
      reply: `In Ayurveda, finding balance starts with understanding your body's rhythm and soothing any aggravated doshas.\n\n${textSnippet}...\n\n* **Soothing Kitchen Remedies:** Gentle warm infusions (such as warm water with fresh crushed ginger or a pinch of turmeric) support your digestive fire (*Agni*) and restore calm.\n* **Rest & Nourishment:** Drink plenty of warm fluids, rest well, and favor light, easily digestible meals.\n\nFeel free to tell me more about what you are feeling so I can guide you further.`,
      sources: []
    };
  }

  return {
    reply: 'In Ayurveda, health is seen as a harmonious balance between the doshas (Vata, Pitta, and Kapha) and strong digestive fire (*Agni*).\n\nFor gentle everyday well-being, sipping warm water, taking light freshly cooked meals, and maintaining regular daily rhythms are recommended.\n\nPlease describe what symptoms you are experiencing so I can offer you practical, natural guidance.',
    sources: []
  };
}

function drawChat() {
  const log=document.querySelector('#log');
  if (!log) return;
  log.innerHTML='<div class="chat-row ai-row"><div class="bubble ai"><div class="ai-meta"><span>'+icon('leaf')+' BharatVeda AI</span><span class="model-badge">Gemini 3.5 Flash-Lite</span></div><p>'+t('welcome')+'</p></div></div>'+chat.map(item => {
    if (item.role === 'user') {
      return '<div class="chat-row user-row"><div class="bubble me">' + escapeText(item.value) + '</div></div>';
    }
    if (item.loading) {
      return '<div class="chat-row ai-row"><div class="bubble loading">' + t('aiThinking') + '</div></div>';
    }
    if (item.aiReply) {
      const emergencyBtn = item.isEmergency ? '<div class="actions" style="margin-top:10px;"><a class="btn" href="tel:112">'+t('call')+'</a></div>' : '';
      return '<div class="chat-row ai-row">' +
        '<div class="bubble ai ' + (item.isEmergency ? 'danger' : '') + '">' +
          '<div class="ai-meta">' +
            '<span>' + icon('leaf') + ' BharatVeda AI</span>' +
            '<span class="model-badge">Gemini 3.5 Flash-Lite</span>' +
          '</div>' +
          '<div class="ai-content">' + formatMarkdown(item.aiReply) + '</div>' +
          emergencyBtn +
        '</div>' +
      '</div>';
    }
    return '';
  }).join('');
  log.scrollTop=log.scrollHeight;
}

function drawNote() {
  const draft = document.querySelector('#draft');
  if(!draft) return;
  draft.hidden = !noteShown;
  if (!noteShown) return;
  const hasUrgency = emergencyInChat || urgentPattern.test(Object.values(noteValues).join(' '));
  draft.value = [
    'S — '+(noteValues.symptoms.trim()||t('none')),
    t('duration')+' '+(noteValues.duration||t('none')),
    t('routine')+' '+(noteValues.routine||t('none')),
    'O — '+t('objective'),'A — '+t('assessment'),'P — '+t(hasUrgency?'emergency':'plan')
  ].join('\n');
}

function assistant() {
  main.innerHTML = head('assistant') +
    '<div class="wrap pagebody stack">' +
      '<div class="warning">' + t('safety') + '</div>' +
      '<div class="assistant-fullscreen">' +
        '<section class="chat-viewport panel">' +
          '<div class="chat-head"><h2>' + t('chatTitle') + '</h2><button class="chip" id="clear">' + t('clear') + '</button></div>' +
          '<div id="log" class="chatlog" role="log" aria-live="polite" aria-label="' + t('chatTitle') + '"></div>' +
          '<div class="chat-deck">' +
            '<div class="chips">' + ['cough','cold','throat','urgent'].map(k => '<button type="button" class="chip sample" data-key="' + k + '">' + t(k) + '</button>').join('') + '</div>' +
            '<form id="chat" class="compose">' +
              '<input id="message" lang="' + ({en:'en-IN',hi:'hi-IN',te:'te-IN'}[lang]) + '" aria-label="' + t('message') + '" placeholder="' + t('message') + '" maxlength="400" required autocomplete="off">' +
              '<button class="btn">' + t('send') + '</button>' +
              '<button type="button" id="voice" class="btn alt">' + icon('mic') + t('voice') + '</button>' +
            '</form>' +
            '<p class="soft" style="margin:2px 0 0;">' + t('voiceHint') + (lang==='te'?' '+t('voiceTelugu'):'') + '</p>' +
            '<p class="soft" id="voice-status" role="status" style="margin:0;"></p>' +
          '</div>' +
        '</section>' +
        '<details class="soap-drawer">' +
          '<summary>' + t('visitNote') + ' (SOAP Note Draft)</summary>' +
          '<div class="soap-drawer-content" id="visit-note"></div>' +
        '</details>' +
      '</div>' +
    '</div>';
  mountVisitNote();
  const field = document.querySelector('#message');

  const add = async (value) => {
    if (!value || !value.trim()) return;
    const clean = value.trim();
    const isUrgent = urgentPattern.test(clean);
    const isGreeting = greetingPattern.test(clean);
    if (isUrgent) emergencyInChat = true;

    // Add user message
    chat.push({ role: 'user', value: clean, isEmergency: isUrgent });
    
    // Add thinking placeholder
    const loadingIdx = chat.length;
    chat.push({ role: 'assistant', loading: true });
    
    if (chat.length > 24) chat.splice(0, chat.length - 24);
    drawChat();
    field.value = '';

    // Only add real symptom inquiries to SOAP note (skip casual greetings)
    if (!isGreeting) {
      noteValues.symptoms = [noteValues.symptoms, clean].filter(Boolean).join('; ');
      drawNote();
    }

    try {
      // Step 1: Retrieve context chunks
      let relevantChunks = [];
      if (!isGreeting) {
        relevantChunks = searchClientKnowledge(clean, 4);
      }

      // Step 2: Query API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          context: relevantChunks,
          lang,
          profile: read(careKeys.profile, null),
          apiKey: getStoredApiKey()
        })
      });

      if (!res.ok) throw new Error('API status: ' + res.status);
      const data = await res.json();

      chat[loadingIdx] = {
        role: 'assistant',
        aiReply: data.reply,
        sources: data.sources || [],
        isEmergency: Boolean(isUrgent || data.isEmergency)
      };
    } catch (err) {
      console.warn('API route call bypassed or failed, using natural local Ayurvedic synthesis:', err);
      const fallbackChunks = isGreeting ? [] : searchClientKnowledge(clean, 4);
      const fallback = localSynthesize(clean, fallbackChunks, lang, isUrgent);
      chat[loadingIdx] = {
        role: 'assistant',
        aiReply: fallback.reply,
        sources: fallback.sources || [],
        isEmergency: isUrgent
      };
    }

    drawChat();
    drawNote();
  };

  document.querySelector('#chat').onsubmit = event => { event.preventDefault(); add(field.value); };

  // Sample chips now trigger articulated natural inquiries instead of hardcoded strings
  document.querySelectorAll('.sample').forEach(button => {
    button.onclick = () => {
      const key = button.dataset.key;
      const naturalPrompt = sampleQueries[key]?.[lang] || t(key);
      add(naturalPrompt);
    };
  });

  document.querySelector('#clear').onclick = () => { chat.length=0; emergencyInChat=false; drawChat(); drawNote(); };
  document.querySelector('#voice').onclick = () => startVoice();
  drawChat();
}
function mountVisitNote() {
  document.querySelector('#visit-note').innerHTML='<h2>'+t('visitNote')+'</h2><p>'+t('noteP')+'</p><form id="note">'+
    '<div class="field"><label for="symptoms">'+t('visitInput')+'</label><textarea id="symptoms" rows="3" maxlength="800"></textarea></div>'+
    fields('duration','duration','maxlength="100"')+fields('routine','routine','maxlength="250"')+
    '<button class="btn alt">'+t('make')+'</button></form><div class="field visit-link"><textarea id="draft" rows="8" readonly aria-label="'+t('note')+'" hidden></textarea></div>';
  if(!noteValues.symptoms) noteValues.symptoms=chat.map(item=>item.value).join(' / ').slice(0,800);
  for(const key of ['symptoms','duration','routine']){
    const input=document.querySelector('#'+key);
    input.value=noteValues[key];
    input.oninput=()=>{noteValues[key]=input.value;noteShown=false;drawNote();};
  }
  document.querySelector('#note').onsubmit=event=>{event.preventDefault();noteShown=true;drawNote();document.querySelector('#draft').focus();};
  drawNote();
}
let speech;
function startVoice(local=false) {
  if(speech){speech.stop();return;}
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const status=document.querySelector('#voice-status');
  const button=document.querySelector('#voice');
  if(!Recognition){status.textContent=t(lang==='te'?'micTelugu':'micFallback');return;}
  const field=document.querySelector('#message');
  let current;
  try {current=new Recognition();} catch {status.textContent=t('micFallback');return;}
  speech=current;
  const activeLang=lang;
  current.lang={en:'en-IN',hi:'hi-IN',te:'te-IN'}[activeLang];
  if(local) current.processLocally=true;
  current.continuous=false;
  current.interimResults=true;
  const prior=field.value;
  let received=false;
  let errorCode='';
  let timer;
  const setButton=key=>{button.innerHTML=icon('mic')+t(key);};
  current.onresult=event=>{
    if(speech!==current)return;
    const transcript=Array.from(event.results,result=>result[0].transcript).join(' ').trim();
    if(transcript){received=true;field.value=[prior,transcript].filter(Boolean).join(' ').slice(0,400);}
  };
  current.onerror=event=>{
    if(speech!==current)return;
    errorCode=event.error;
    const errors={'not-allowed':'micBlocked','service-not-allowed':'micBlocked','language-not-supported':'micLanguage','network':'micNetwork','audio-capture':'micMissing'};
    status.textContent=t(errors[errorCode]||'micFallback');
  };
  current.onend=()=>{
    clearTimeout(timer);
    if(speech!==current)return;
    speech=null;
    setButton('voice');
    if(received){status.textContent=t('reviewVoice');field.focus();}
    else if(status.textContent===t('listening'))status.textContent=t('micFallback');
    if(!local&&activeLang==='te'&&['network','language-not-supported'].includes(errorCode)&&
       'processLocally' in current&&typeof Recognition.available==='function'){
      Recognition.available({langs:[current.lang],processLocally:true}).then(availability=>{
        if(availability==='available'&&!speech&&button.isConnected&&lang===activeLang)startVoice(true);
      }).catch(()=>{});
    }
  };
  try {
    current.start();
    status.textContent=t('listening');
    setButton('stopVoice');
    timer=setTimeout(()=>{
      if(speech!==current)return;
      current.abort();
      current.onend();
    },15000);
  } catch {speech=null;status.textContent=t('micFallback');setButton('voice');}
}
const plantArt = (slug,names) => '<div class="plantart"><img src="'+slug+'.webp" alt="'+names[li()]+'" width="420" height="250" loading="lazy" decoding="async"></div>';
function plantCard([slug,names,latin,desc]) {
  return '<article class="card plant">'+plantArt(slug,names)+'<div class="body"><div class="tag">'+latin+'</div><h3>'+names[li()]+'</h3><p>'+desc[li()]+'</p><a class="link" href="#plant/'+slug+'" aria-label="'+t('details')+' · '+names[li()]+'">'+t('details')+' '+icon('arrow')+'</a></div></article>';
}
function library() {
  main.innerHTML = head('library','plantP')+'<div class="wrap pagebody"><div class="search">'+fields('search','search','type="search" autocomplete="off"')+'</div><div id="plants" class="grid"></div><p id="no-plants" role="status" hidden>'+t('empty')+'</p></div>';
  const input = document.querySelector('#search');
  const results = document.querySelector('#plants');
  const filter = () => {
    const q=input.value.trim().toLowerCase();
    const matches=plants.filter(([slug,names,latin])=>[slug,latin,...names].some(name=>name.toLowerCase().includes(q)));
    results.innerHTML=matches.map(plantCard).join('');
    document.querySelector('#no-plants').hidden=Boolean(matches.length);
  };
  input.oninput=filter; filter();
}
function profile(slug) {
  const plant=plants.find(item=>item[0]===slug);
  if (!plant) {library();return;}
  const [,names,latin,desc]=plant;
  main.innerHTML='<div class="wrap pagehead"><a class="link" href="#library">'+t('back')+'</a><h1>'+names[li()]+'</h1><p class="intro"><i>'+latin+'</i></p></div><div class="wrap pagebody two"><article class="panel">'+plantArt(slug,names)+'<p>'+desc[li()]+'</p><a class="link" href="https://www.nccih.nih.gov/health/'+slug+'">'+t('source')+' · NCCIH</a></article><aside class="panel"><h2>'+t('precautions')+'</h2><p>'+t('plantSafe')+'</p></aside></div>';
}
function render() {
  clearInterval(buddyTimer);
  if (speech) {speech.abort(); speech=null;}
  const requested=location.hash.slice(1);
  const signedInRoutes=['assistant','library','plant','buddy','journal','doctors','profile'];
  const [route]=requested.split('/');
  const destination=demoSignedIn
    ? (signedInRoutes.includes(route)?requested:'assistant')
    : (requested==='login'?'login':'home');
  if(requested!==destination&&requested!=='') history.replaceState(null,'','#'+destination);
  const [page,slug]=destination.split('/');
  document.documentElement.lang=lang;
  language.value=lang;
  document.querySelectorAll('[data-i]').forEach(el=>el.textContent=t(el.dataset.i));
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
  document.querySelectorAll('nav a').forEach(a=>{
    a.removeAttribute('aria-current');
    if(a.hash==='#'+(page==='plant'?'library':page||'home')) a.setAttribute('aria-current','page');
  });
  const person=read(careKeys.profile,null);
  document.querySelector('nav').hidden=!demoSignedIn||!person;
  document.querySelector('.header-login').hidden=demoSignedIn||page==='login';
  document.querySelectorAll('.brand').forEach(brand=>brand.href=demoSignedIn?'#assistant':'#home');
  document.querySelector('.account').hidden=!demoSignedIn||!person;
  if(!demoSignedIn){
    if(page==='login') demoSignIn();
    else main.innerHTML=home();
  }
  else if(!person || page==='profile') patientProfile(page==='plant'?'plant/'+slug:page);
  else if(page==='assistant') assistant();
  else if(page==='library') library();
  else if(page==='plant') profile(slug);
  else if(page==='buddy'||page==='journal') patientBuddy();
  else if(page==='doctors') doctors();
}
language.onchange=()=>{
  lang=language.value;
  try{localStorage.setItem('vedaLanguage',JSON.stringify(lang));}catch{}
  render();
};

document.querySelector('.skip').onclick=event=>{event.preventDefault();main.focus();};
window.addEventListener('hashchange',()=>{render(); window.scrollTo({top:0,behavior:'instant'}); main.focus({preventScroll:true});});
