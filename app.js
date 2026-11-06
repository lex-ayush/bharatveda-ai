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
const urgentPattern = /chest (pain|pressure|tightness)|heart attack|breathless|breathing (difficulty|trouble)|difficulty breathing|trouble breathing|shortness of breath|short of breath|unable to swallow|difficulty swallowing|bluish lips|blue lips|can.t breathe|cannot breathe|cough(ing)? up blood|unconscious|seizure|सीने में (दर्द|दबाव)|छाती में दर्द|साँस लेने में|सांस लेने में|निगल नहीं|नीले होंठ|बेहोश|दौरा|छाती में दबाव|छाती में जकड़न|छाती में जकड़न|saans (nahi|nahin)|seene (mein|me) dard|ఛాతి నొప్పి|ఛాతీ నొప్పి|ఛాతిలో నొప్పి|ఊపిరి ఆడ|శ్వాస తీసుకోవడ|మింగలేక|స్పృహ కోల్పో|ఫిట్స్/iu;
const sampleReplies = {cough:'coughCare',cold:'noseCare',throat:'throatCare',urgent:'emergency'};
const mildReplies = [
  [/^(?:(?:a )?(?:mild )?cough|हल्की खाँसी|हल्की खांसी|खाँसी|खांसी|halki khansi|తేలికపాటి దగ్గు|కొద్దిగా దగ్గు|దగ్గు(?: వస్తోంది| ఉంది)?)$/iu,'coughCare','childCough'],
  [/^(?:(?:a )?(?:runny nose|blocked nose|stuffy nose|mild cold|common cold|cold)|नाक बहना|नाक बह रही है|ज़ुकाम|जुकाम|ముక్కు కారడం|ముక్కు కారుతోంది|జలుబు(?: చేసింది| ఉంది)?)$/iu,'noseCare','childNose'],
  [/^(?:(?:a )?(?:mild )?sore throat|गले में दर्द(?: है)?|gale mein dard|గొంతు నొప్పి(?: ఉంది)?)$/iu,'throatCare','childThroat']
];
const careSources = {
  coughCare:['https://www.nhs.uk/symptoms/cough/','NHS'],
  noseCare:['https://www.cdc.gov/common-cold/treatment/','CDC'],
  throatCare:['https://www.nhs.uk/symptoms/sore-throat/','NHS'],
  childCough:['https://www.cdc.gov/common-cold/treatment/','CDC'],
  childNose:['https://www.cdc.gov/common-cold/treatment/','CDC'],
  childThroat:['https://www.nhs.uk/symptoms/sore-throat/','NHS']
};
function classify(value) {
  if(urgentPattern.test(value)) return 'emergency';
  const symptom=value.normalize('NFC').replace(/\s+/g,' ').replace(/[.!?।]+$/u,'').trim()
    .replace(/^(?:i (?:have|(?:am|['’]m) experiencing)|i['’]ve got) /iu,'')
    .replace(/ (?:today|since yesterday|since this morning)$/iu,'');
  const match=mildReplies.find(([pattern])=>pattern.test(symptom));
  if(!match) return 'contactCare';
  return (read(careKeys.profile,null)?.age??0)<18?match[2]:match[1];
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
        out.push('<p>' + formatInline(trimmed) + '</p>');
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
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    clientExtractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', { quantized: true });
    clientVectorSearchReady = Boolean(clientKnowledgeBase && clientExtractor);
  } catch (e) {
    // Graceful fallback to server-side search in /api/chat
  }
}
initClientRAG();

async function searchClientKnowledge(query, topK = 4) {
  if (!clientKnowledgeBase || !clientExtractor) return null;
  try {
    const output = await clientExtractor('Represent this sentence for searching relevant passages: ' + query, { pooling: 'mean', normalize: true });
    const qVec = Array.from(output.data);
    const scored = clientKnowledgeBase.map(c => {
      let dot = 0;
      for (let i = 0; i < 384; i++) dot += qVec[i] * c.embedding[i];
      return { title: c.title, source: c.source, page: c.page, text: c.text, score: dot };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  } catch {
    return null;
  }
}

function chatReply(kind,sample) {
  if(kind==='emergency') return '<p>'+t(kind)+'</p><a class="link" href="tel:112">'+t('call')+'</a>';
  if(kind==='contactCare') return '<p>'+t(kind)+'</p><div class="visit-link">'+link('doctors','doctors','btn alt')+'</div>';
  const [url,source]=careSources[kind];
  return (sample?'<div class="tag">'+t('adultSample')+'</div>':'')+'<p>'+t(kind)+'</p>'+
    '<p>'+t(kind.startsWith('child')?'childWhen':'careWhen')+'</p><a class="link" href="'+url+'">'+t('source')+' · '+source+'</a>';
}
function drawChat() {
  const log=document.querySelector('#log');
  if (!log) return;
  log.innerHTML='<div class="bubble">'+t('welcome')+'</div>'+chat.map(item => {
    if (item.role === 'user') {
      return '<div class="bubble me">' + escapeText(item.value) + '</div>';
    }
    if (item.loading) {
      return '<div class="bubble loading">' + t('aiThinking') + '</div>';
    }
    if (item.aiReply) {
      const sourcesHtml = item.sources && item.sources.length ? `
        <div class="rag-sources">
          <span class="rag-sources-label">${t('aiSourcesTitle')}</span>
          <div class="source-tags">
            ${item.sources.map(s => `<span class="source-tag">${escapeText(s.source)} (p. ${s.page})</span>`).join('')}
          </div>
        </div>
      ` : '';
      const emergencyBtn = item.isEmergency ? `<div class="actions" style="margin-top:10px;"><a class="btn" href="tel:112">${t('call')}</a></div>` : '';
      return `
        <div class="bubble ${item.isEmergency ? 'danger' : ''}">
          <div class="rag-meta">
            <span>${icon('leaf')} BharatVeda AI</span>
            <span class="model-pill">Gemini 3.6 Flash · BAAI/bge-small-en-v1.5</span>
          </div>
          <div class="ai-content">${formatMarkdown(item.aiReply)}</div>
          ${sourcesHtml}
          ${emergencyBtn}
        </div>
      `;
    }
    // Fallback or legacy canned replies
    return '<div class="bubble ' + (item.kind === 'emergency' ? 'danger' : '') + '">' + chatReply(item.kind, item.sample) + '</div>';
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
  main.innerHTML = head('assistant')+'<div class="wrap pagebody stack"><div class="warning">'+t('safety')+'</div><div class="assistant-shell"><section class="panel"><h2>'+t('chatTitle')+'</h2><div id="log" class="chatlog" role="log" aria-live="polite" aria-label="'+t('chatTitle')+'"></div><div class="chips">'+['cough','cold','throat','urgent'].map(k=>'<button type="button" class="chip sample" data-key="'+k+'">'+t(k)+'</button>').join('')+'</div><form id="chat" class="compose"><input id="message" lang="'+({en:'en-IN',hi:'hi-IN',te:'te-IN'}[lang])+'" aria-label="'+t('message')+'" placeholder="'+t('message')+'" maxlength="400" required><button class="btn">'+t('send')+'</button><button type="button" id="voice" class="btn alt">'+icon('mic')+t('voice')+'</button></form><p class="soft">'+t('voiceHint')+(lang==='te'?' '+t('voiceTelugu'):'')+'</p><p class="soft" id="voice-status" role="status"></p><button class="chip" id="clear">'+t('clear')+'</button></section>'+
  '</div></div>';
  const field = document.querySelector('#message');
  const add = async (value,sampleKey) => {
    if (!value.trim()) return;
    const clean = value.trim();
    const isUrgent = urgentPattern.test(clean) || sampleKey === 'urgent';
    if (isUrgent) emergencyInChat = true;

    // Add user message
    chat.push({ role: 'user', value: clean, kind: isUrgent ? 'emergency' : 'chat' });
    
    // Add thinking placeholder
    const loadingIdx = chat.length;
    chat.push({ role: 'assistant', loading: true });
    
    // Keep max 24 items in history
    if (chat.length > 24) chat.splice(0, chat.length - 24);
    drawChat();
    field.value = '';

    // Update SOAP symptom note
    noteValues.symptoms = [noteValues.symptoms, clean].filter(Boolean).join('; ');
    drawNote();

    try {
      let clientContext = null;
      if (clientVectorSearchReady) {
        clientContext = await searchClientKnowledge(clean, 4);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          context: clientContext,
          lang,
          profile: read(careKeys.profile, null)
        })
      });

      if (!res.ok) throw new Error('Chat API error: ' + res.status);
      const data = await res.json();

      chat[loadingIdx] = {
        role: 'assistant',
        aiReply: data.reply,
        sources: data.sources || [],
        isEmergency: Boolean(isUrgent || data.isEmergency)
      };
    } catch (err) {
      console.warn('AI call fallback:', err);
      const kind = sampleKey ? sampleReplies[sampleKey] : isUrgent ? 'emergency' : classify(clean);
      chat[loadingIdx] = {
        role: 'assistant',
        kind,
        sample: Boolean(sampleKey),
        value: clean
      };
    }

    drawChat();
    drawNote();
  };
  document.querySelector('#chat').onsubmit = event => { event.preventDefault(); add(field.value); };
  document.querySelectorAll('.sample').forEach(button => button.onclick = () => add(t(button.dataset.key),button.dataset.key));
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
