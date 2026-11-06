const doctorUrl = 'https://esanjeevani.mohfw.gov.in/#/patient/signin';
const careKeys = {profile:'vedaProfileV2', buddy:'vedaBuddyV2'};
const doctorButton = () => '<a class="btn" href="'+doctorUrl+'">'+t('doctorLink')+' '+icon('arrow')+'</a>';
let demoSignedIn = false;
try {demoSignedIn=sessionStorage.getItem('vedaDemoSignIn')==='yes';} catch {}
function demoSignIn() {
  main.innerHTML=head('signIn','signInIntro')+'<div class="wrap pagebody"><form id="demo-form" class="panel setup">'+
    fields('demo-user','demoUser','required maxlength="80" autocomplete="off"')+
    fields('demo-code','demoCode','required maxlength="80" autocomplete="off"')+
    '<button class="btn">'+t('enterDemo')+'</button></form></div>';
  document.querySelector('#demo-form').onsubmit=event=>{
    event.preventDefault();
    for(const input of event.currentTarget.querySelectorAll('input')){
      if(!input.value.trim()){input.focus();return;}
    }
    demoSignedIn=true;
    try {sessionStorage.setItem('vedaDemoSignIn','yes');} catch {}
    render();
    main.focus();
  };
}
function writeCare(key,value,status) {
  try {localStorage.setItem(key,JSON.stringify(value)); return true;}
  catch {status.textContent=t('storageFail'); return false;}
}
function patientProfile(destination) {
  const person=read(careKeys.profile,null);
  main.innerHTML=head('profile','profileIntro')+'<div class="wrap pagebody"><form id="profile-form" class="panel setup">'+
    fields('alias','alias','required maxlength="50" autocomplete="off"')+
    fields('age','age','type="number" min="0" max="120" step="1" required')+
    fields('district','district','maxlength="65" autocomplete="off"')+
    '<button class="btn">'+t('unlock')+'</button><p id="profile-status" role="status"></p>'+
    (person?'<button type="button" class="chip" id="profile-reset">'+t('reset')+'</button>':'')+'</form></div>';
  const alias=document.querySelector('#alias');
  const age=document.querySelector('#age');
  const district=document.querySelector('#district');
  const status=document.querySelector('#profile-status');
  alias.value=person?.alias||'';
  age.value=person?.age??'';
  district.value=person?.district||'';
  document.querySelector('#profile-form').onsubmit=event=>{
    event.preventDefault();
    if(!alias.value.trim()){alias.focus();return;}
    if(writeCare(careKeys.profile,{alias:alias.value.trim(),age:Number(age.value),district:district.value.trim()},status)){
      const target=destination&&destination!=='profile'?destination:'assistant';
      if(location.hash==='#'+target) render();
      else location.hash=target;
    }
  };
  if(person) document.querySelector('#profile-reset').onclick=()=>{
    if(!window.confirm(t('resetConfirm'))) return;
    try {for(const key of [...Object.values(careKeys),'vedaJournal']) localStorage.removeItem(key);}
    catch {status.textContent=t('storageFail');return;}
    chat.length=0;
    emergencyInChat=false;
    noteValues={symptoms:'',duration:'',routine:''};
    noteShown=false;
    render();
  };
}
function doctors() {
  main.innerHTML=head('doctors','doctorIntro')+'<div class="wrap pagebody stack"><div class="warning danger">'+t('emergencyGeneral')+
    ' <a href="tel:112">'+t('call')+'</a></div><div class="two"><section class="panel care-panel"><h2>eSanjeevani</h2>'+
    '<p>'+t('doctorNote')+'</p><div class="actions">'+doctorButton()+'</div></section>'+
    '<section class="panel care-panel"><h2>'+t('buddy')+'</h2><p>'+t('buddyIntro')+'</p>'+link('buddy','buddy','btn alt')+'</section></div><section id="visit-note" class="panel care-panel"></section></div>';
  mountVisitNote();
}
const pad = value => String(value).padStart(2,'0');
function localDay(date) {
  return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());
}
const shortText = selector => document.querySelector(selector).value.trim();
const careId = () => globalThis.crypto?.randomUUID?.() ?? Date.now()+'-'+Math.random().toString(36).slice(2);
const dateLabel = stamp => new Date(stamp).toLocaleString(lang,{dateStyle:'short',timeStyle:'short'});
let buddyTimer;
function patientBuddy() {
  const oldJournal=read('vedaJournal',[]);
  let data=read(careKeys.buddy,{plans:[],checks:Array.isArray(oldJournal)?oldJournal:[], doses:{}});
  main.innerHTML=head('buddy','buddyIntro')+'<div class="wrap pagebody stack"><div class="warning">'+t('safety')+'</div><div class="two">'+
    '<section class="panel care-panel"><span class="eyebrow">01</span><h2>'+t('planTitle')+'</h2><p>'+t('planHint')+'</p>'+
    '<div class="rx-import"><p>'+t('rxHelp')+'</p><div class="actions"><button type="button" class="btn" id="sample-rx">'+t('sampleRx')+'</button></div>'+
    '<details class="rx-manual"><summary>'+t('importRx')+'</summary><input id="rx-file" type="file" accept=".json,application/json" aria-label="'+t('importRx')+'"></details>'+
    '<div id="rx-preview" class="rx-preview"></div><p id="rx-status" role="status"></p></div><h3>'+t('todaySchedule')+'</h3><div id="schedule"></div>'+
    '<details class="rx-manual"><summary>'+t('manual')+'</summary><form class="care-form" id="plan-form">'+fields('clinician','clinician','required maxlength="75"')+fields('medicine','medicine','required maxlength="90"')+
    '<div class="field"><label for="instructions">'+t('instructions')+'</label><textarea id="instructions" rows="2" required maxlength="300"></textarea></div>'+
    fields('dose-time','doseTime','type="time" required')+'<div class="care-dates">'+fields('start-date','startDate','type="date" required')+
    fields('end-date','endDate','type="date" required')+'</div><button class="btn">'+t('addSchedule')+'</button></form></details>'+
    '<p id="plan-status" role="status"></p><p class="soft">'+t('missedHelp')+'</p></section>'+
    '<section class="panel care-panel"><span class="eyebrow">02</span><h2>'+t('checkin')+'</h2><p>'+t('checkinHint')+'</p>'+
    '<form id="check-form" class="care-form">'+fields('sample','message','required maxlength="120"')+fields('score','score','type="number" min="0" max="10" step="1" required')+
    '<button class="btn">'+t('save')+'</button></form><p id="check-status" role="status"></p><div id="trend" aria-live="polite"></div><div id="checks"></div>'+
    '<div class="care-foot">'+link('doctors','doctors','btn alt')+'</div></section></div></div>';
  const schedule=document.querySelector('#schedule');
  const status=document.querySelector('#plan-status');
  const checks=document.querySelector('#checks');
  const checkStatus=document.querySelector('#check-status');
  const today=localDay(new Date());
  document.querySelector('#start-date').value=today;
  document.querySelector('#end-date').value=today;
  let lastSchedule='';
  function showSchedule() {
    const now=new Date();
    const day=localDay(now);
    const time=pad(now.getHours())+':'+pad(now.getMinutes());
    const activeToday=plan=>plan.start<=day&&day<=plan.end;
    const html=data.plans.length?'<ul class="care-list">'+[...data.plans].sort((a,b)=>Number(activeToday(b))-Number(activeToday(a))||a.time.localeCompare(b.time)).map(plan=>{
      const active=plan.start<=day&&day<=plan.end;
      const dose=data.doses[plan.id]?.[day];
      const key=!active?'outside':dose?.status||(time>=plan.time?'due':'upcoming');
      const stamp=dose?' · '+escapeText(dateLabel(dose.at)):'';
      const button=(action,label)=>'<button class="chip" data-plan="'+plan.id+'" data-action="'+action+'">'+t(label)+'</button>';
      const actions=active?(dose?button('undo','undo'):button('taken','markTaken')+(time>=plan.time?button('missed','markMissed'):'')):'';
      const history=Object.entries(data.doses[plan.id]||{}).filter(([date])=>date!==day).sort(([a],[b])=>b.localeCompare(a)).slice(0,7);
      return '<li class="care-item"><div class="tag">'+escapeText(plan.time)+' · '+escapeText(plan.start)+' — '+escapeText(plan.end)+'</div>'+
        '<h3>'+escapeText(plan.medicine)+'</h3><p class="soft">'+escapeText(plan.clinician)+'</p><p>'+escapeText(plan.instructions)+'</p>'+
        '<span class="status-tag '+(key==='due'?'due':key==='taken'?'done':'')+'">'+t(key)+stamp+'</span><div class="actions">'+actions+button('remove','removeItem')+'</div>'+
        (history.length?'<ul class="soft">'+history.map(([,log])=>'<li>'+escapeText(dateLabel(log.at))+' · '+t(log.status)+'</li>').join('')+'</ul>':'')+'</li>';
    }).join('')+'</ul>':'<p>'+t('noPlan')+'</p>';
    if(html!==lastSchedule){schedule.innerHTML=html;lastSchedule=html;}
  }
  function showChecks() {
    const latest=data.checks[0];
    const normalize=name=>name.trim().toLowerCase().normalize('NFC');
    const prior=latest&&data.checks.slice(1).find(item=>normalize(item.name)===normalize(latest.name));
    const urgent=latest&&urgentPattern.test(latest.name);
    const follow=prior&&latest.score>0&&latest.score>=prior.score;
    document.querySelector('#trend').innerHTML=urgent?
      '<p class="warning danger">'+t('emergency')+' <a href="tel:112">'+t('call')+'</a></p>':prior?
      '<div class="trend '+(follow?'warning':'')+'"><p>'+t(follow?'follow':latest.score===prior.score?'zero':'lower')+'</p>'+
      (follow?link('doctors','doctors','btn alt'):'')+'</div>':'';
    checks.innerHTML=data.checks.length?'<ol class="history">'+data.checks.map(({name,score,date})=>'<li>'+escapeText(dateLabel(date))+' · '+escapeText(name)+' · '+escapeText(score)+'/10</li>').join('')+'</ol>':'<p>'+t('noEntries')+'</p>';
  }
  function save(next,feedback) {
    if(!writeCare(careKeys.buddy,next,feedback)) return false;
    data=next;
    feedback.textContent='';
    showSchedule();
    showChecks();
    return true;
  }
  const rxPreview=document.querySelector('#rx-preview');
  const rxStatus=document.querySelector('#rx-status');
  function showImport(items) {
    rxStatus.textContent='';
    rxPreview.innerHTML='<ul class="care-list">'+items.map(item=>'<li class="care-item"><strong>'+escapeText(item.medicine)+'</strong><p>'+
      escapeText(item.clinician)+' · '+escapeText(item.instructions)+'</p><div class="tag">'+escapeText(item.time)+' · '+escapeText(item.start)+' — '+escapeText(item.end)+'</div></li>').join('')+
      '</ul><button type="button" id="accept-rx" class="btn">'+t('acceptRx')+'</button>';
    document.querySelector('#accept-rx').onclick=()=>{
      const signature=({clinician,medicine,instructions,time,start,end})=>JSON.stringify([clinician,medicine,instructions,time,start,end]);
      const known=new Set(data.plans.map(signature));
      const added=[];
      for(const item of items){
        const key=signature(item);
        if(!known.has(key)){known.add(key);added.push({...item,id:careId()});}
      }
      if(!added.length){rxStatus.textContent=t('rxDuplicate');return;}
      if(save({...data,plans:[...data.plans,...added]},rxStatus)){
        rxPreview.innerHTML='';
        rxStatus.textContent=t('rxAdded');
      }
    };
  }
  document.querySelector('#sample-rx').onclick=()=>{
    const next=new Date();
    next.setDate(next.getDate()+2);
    showImport(['09:00','18:00'].map(time=>({
      clinician:t('clinician'),medicine:t('medicine'),instructions:t('safety'),time,start:today,end:localDay(next)
    })));
  };
  const rxFile=document.querySelector('#rx-file');
  rxFile.onchange=async()=>{
    const file=rxFile.files[0];
    rxFile.value='';
    if(!file)return;
    rxPreview.innerHTML='';
    try{
      if(file.size>40000)throw Error('size');
      const value=JSON.parse(await file.text());
      const textField=(field,max)=>typeof field==='string'&&field.trim().length>0&&field.length<=max;
      const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&localDay(new Date(date+'T12:00:00'))===date;
      if(value?.schema!=='bharatveda-demo-rx-v1'||!Array.isArray(value.items)||!value.items.length||value.items.length>20)throw Error('schema');
      const items=value.items.map(item=>{
        const {clinician,medicine,instructions,time,start,end}=item;
        if(!textField(clinician,75)||!textField(medicine,90)||!textField(instructions,300)||
          typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!validDate(start)||!validDate(end)||end<start)throw Error('item');
        return {clinician,medicine,instructions,time,start,end};
      });
      if(rxPreview.isConnected)showImport(items);
    }catch{rxStatus.textContent=t('rxInvalid');}
  };
  document.querySelector('#plan-form').onsubmit=event=>{
    event.preventDefault();
    const start=shortText('#start-date'),end=shortText('#end-date');
    if(end<start){status.textContent=t('dateError');return;}
    const plan={id:careId(),clinician:shortText('#clinician'),medicine:shortText('#medicine'),instructions:shortText('#instructions'),time:shortText('#dose-time'),start,end};
    if(!plan.clinician||!plan.medicine||!plan.instructions)return;
    if(save({...data,plans:[...data.plans,plan]},status)){
      document.querySelector('#dose-time').value='';
      document.querySelector('#dose-time').focus();
    }
  };
  schedule.onclick=event=>{
    const button=event.target.closest('button[data-plan]');
    if(!button)return;
    const id=button.dataset.plan;
    const action=button.dataset.action;
    const plan=data.plans.find(item=>item.id===id);
    if(!plan)return;
    const doses={...data.doses};
    if(action==='remove'){
      if(!window.confirm(t('removal')))return;
      delete doses[id];
      save({...data,doses,plans:data.plans.filter(item=>item.id!==id)},status);
      return;
    }
    const now=new Date();
    const day=localDay(now);
    if(day<plan.start||day>plan.end){showSchedule();return;}
    const log={...doses[id]};
    if(action==='undo')delete log[day];
    else log[day]={status:action,at:now.getTime()};
    doses[id]=log;
    save({...data,doses},status);
  };
  document.querySelector('#check-form').onsubmit=event=>{
    event.preventDefault();
    const name=shortText('#sample');
    const score=Number(shortText('#score'));
    if(name&&save({...data,checks:[{name,score,date:Date.now()},...data.checks].slice(0,50)},checkStatus)) document.querySelector('#score').value='';
  };
  showSchedule();showChecks();
  buddyTimer=setInterval(showSchedule,15000);
}
render();
