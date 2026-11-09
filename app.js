(async()=>{
 'use strict';
 const app=document.querySelector('[data-demo-app]'),storageKey='hanzi-pocket-preview-state-v2';
 const [catalog,stem]=await Promise.all(['hsk-catalog.json','stem-data.json'].map(async file=>{const r=await fetch(new URL(file,document.baseURI));if(!r.ok)throw new Error('Reconnect and reload to finish loading the vocabulary.');return r.json();}));
 const words=[...stem,...catalog.map(w=>({id:w.id,h:w.hanzi,p:w.pinyin,m:w.meaning,zh:'',en:'',source:'hsk',level:w.level}))],byId=new Map(words.map(w=>[w.id,w]));
 const subjects=[
  {id:'math',name:'Mathematics',zh:'数学',icon:'sigma',kind:'CSCA core',ids:['m1','m2','m3','m4']},
  {id:'physics',name:'Physics',zh:'物理',icon:'orbit',kind:'CSCA core',ids:['p1','p2','p3','p4']},
  {id:'chemistry',name:'Chemistry',zh:'化学',icon:'flask-conical',kind:'CSCA core',ids:['c1','c2','c3','c4']},
  {id:'computing',name:'Computing',zh:'计算机',icon:'code',kind:'CSCA core',ids:['t1','t2','t3','t4']},
  {id:'biology',name:'Biology',zh:'生物',icon:'sprout',kind:'STEM enrichment',ids:['b1','b2','b3','b4']},
  {id:'engineering',name:'Engineering',zh:'工程',icon:'wrench',kind:'STEM enrichment',ids:['e1','e2','e3','e4']}
 ];
 const paths=[
  {id:'csca-terms',name:'Scientific terms',zh:'专业词汇',desc:'Maths, physics, chemistry and computing.',ids:['m1','p3','c1','t1']},
  {id:'csca-formulas',name:'Formulas & quantities',zh:'公式与单位',desc:'Equations, variables, units and measurements.',ids:['m2','m3','l3','l2']},
  {id:'csca-lab',name:'Laboratory language',zh:'实验用语',desc:'Experiments, reactions and conclusions.',ids:['l1','l2','c4','l4']},
  {id:'csca-data',name:'Reading graphs & data',zh:'图表与数据',desc:'Charts, change and scientific trends.',ids:['g1','t2','g2','g4']}
 ].map(d=>({...d,kind:'CSCA preparation'}));
 const hsk=[1,2,3,4,5].map(level=>({id:'hsk-'+level,name:'HSK '+level,kind:'General Chinese',level,zh:['初','知','进','远','深'][level-1],ids:catalog.filter(w=>w.level===level).map(w=>w.id)}));
 const decks=[...subjects,...paths,...hsk];
 const legacy={h1a:'hsk2026-1',h1b:'hsk2026-2',h2a:'hsk2026-302',h2b:'hsk2026-301',h3a:'hsk2026-501',h3b:'hsk2026-502',h4a:'hsk2026-1002',h4b:'hsk2026-1001',h5a:'hsk2026-2001',h5b:'hsk2026-2002'};
 const defaults=()=>({panel:'stem',stemTab:'subjects',deck:null,mode:'dictation',study:false,revealed:false,hint:false,saved:[],customWords:[],groups:[],memberships:{},activeGroup:null,progress:{},queues:{},pocketFilter:'all',lastHskLevel:1,history:[]});
 let state=defaults(),modal=null,detailId=null,pendingIds=[],editingGroup=null,query='',limit=60,selecting=false,selected=new Set(),message='',audioStatus='',voiceRequest=0,drag=null,blockedUntil=0;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=name=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
 const btn=(text,action,cls='hp-primary',attrs='')=>`<button type="button" class="${cls}" data-action="${action}" ${attrs}>${text}</button>`;
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 const sourceName=w=>w.source==='hsk'?'HSK':w.source==='stem'?'STEM':'Personal';
 const mapId=id=>legacy[id]??id;
 function restore(){
  let raw;try{raw=JSON.parse(localStorage.getItem(storageKey)||'null');if(!raw)raw=JSON.parse(localStorage.getItem('codex:visualization-widget-state-v2:'+JSON.stringify(['/hanzi-pocket-preview/','']))||'null');}catch{message='Saved preview data could not be read. Nothing was deleted.';return;}
  const old=raw?.privateContent?.stemDemo?.state??raw?.state;if(!old)return;
  const s={...defaults(),...old};
  for(const w of Array.isArray(s.customWords)?s.customWords:[]){if(w&&typeof w.id==='string'&&typeof w.h==='string'&&typeof w.p==='string'&&typeof w.m==='string'&&!byId.has(w.id)){const item={...w,source:'personal'};words.push(item);byId.set(item.id,item);}}
  s.customWords=words.filter(w=>w.source==='personal');s.saved=[...new Set((Array.isArray(s.saved)?s.saved:[]).map(mapId).filter(id=>byId.has(id)))];
  s.groups=(Array.isArray(s.groups)?s.groups:[]).filter(g=>g&&typeof g.id==='string'&&typeof g.name==='string');
  s.memberships=object(s.memberships);for(const [id,ids]of Object.entries(s.memberships)){if(!byId.has(mapId(id))||!Array.isArray(ids)){delete s.memberships[id];continue;}s.memberships[mapId(id)]=[...new Set(ids.filter(g=>s.groups.some(v=>v.id===g)))];if(mapId(id)!==id)delete s.memberships[id];}
  s.progress=Object.fromEntries(Object.entries(object(s.progress)).map(([k,p])=>{const bits=k.split(':');bits[bits.length-1]=mapId(bits.at(-1));return [bits.join(':'),p];}));
  s.queues=Object.fromEntries(Object.entries(object(s.queues)).filter(([,q])=>Array.isArray(q)).map(([k,q])=>[k,[...new Set(q.map(mapId).filter(id=>byId.has(id)))]]));
  s.history=[];s.panel=['review','hsk','stem','pocket','groups'].includes(s.panel)?s.panel:'stem';s.mode=s.mode==='normal'?'normal':'dictation';
  s.pocketFilter=['all','hsk','stem','personal'].includes(s.pocketFilter)?s.pocketFilter:'all';s.activeGroup=s.groups.some(g=>g.id===s.activeGroup)?s.activeGroup:null;
  state=s;if(!deck()){state.deck=null;state.study=false;}
 }
 function persist(){try{localStorage.setItem(storageKey,JSON.stringify({format:'hanzi-pocket-preview',version:2,state:{...state,history:[]}}));}catch{message='Storage is full or unavailable. Export a backup before closing this preview.';}}
 const keyFor=id=>byId.get(id).source+':'+state.mode+':'+id;
 function savedIds(){return state.saved.filter(id=>(state.pocketFilter==='all'||byId.get(id).source===state.pocketFilter)&&(!state.activeGroup||(state.memberships[id]??[]).includes(state.activeGroup)));}
 function deck(){if(state.deck==='pocket')return {id:'pocket',name:'My Pocket',kind:'Personal collection',ids:savedIds()};if(state.deck?.startsWith('group:')){const g=state.groups.find(g=>g.id===state.deck.slice(6));return g?{id:state.deck,name:g.name,kind:'Your collection',ids:state.saved.filter(id=>(state.memberships[id]??[]).includes(g.id))}:null;}return decks.find(d=>d.id===state.deck);}
 function stats(d){const p=d.ids.map(id=>state.progress[keyFor(id)]);return {seen:p.filter(Boolean).length,fresh:p.filter(v=>!v).length,missed:p.filter(v=>v&&!v.correct).length};}
 const shuffled=ids=>{const q=[...ids];for(let i=q.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[q[i],q[j]]=[q[j],q[i]];}return q;};
 const queueKey=()=>state.deck+':'+state.mode+(state.deck==='pocket'?':'+state.pocketFilter+':'+(state.activeGroup??'all'):'');
 function round(d,last){const fresh=d.ids.filter(id=>!state.progress[keyFor(id)]),missed=d.ids.filter(id=>state.progress[keyFor(id)]&&!state.progress[keyFor(id)].correct),known=d.ids.filter(id=>state.progress[keyFor(id)]?.correct);const personal=d.id==='pocket'||d.id.startsWith('group:');const q=personal?shuffled(d.ids):[...shuffled(fresh),...shuffled(missed),...(!fresh.length?shuffled(known):[])];if(q.length>1&&q[0]===last)q.splice(Math.min(12,q.length-1),0,q.shift());return q;}
 function ensureQueue(last){const d=deck();if(!d)return [];const k=queueKey(),allowed=new Set(d.ids);let q=Array.isArray(state.queues[k])?[...new Set(state.queues[k].filter(id=>allowed.has(id)))]:[];if(q.length){const ids=new Set(q);q.push(...shuffled(d.ids.filter(id=>!state.progress[keyFor(id)]&&!ids.has(id))));}else q=round(d,last);state.queues[k]=q;return q;}
 const modePicker=()=>`<div class="hp-switch" role="group" aria-label="Practice mode">${btn('Normal','mode-normal','',`aria-pressed="${state.mode==='normal'}"`)}${btn('Dictation','mode-dictation','',`aria-pressed="${state.mode==='dictation'}"`)}</div>`;
 const nav=()=>`<nav class="hp-nav" aria-label="Main navigation">${[['review','layers','Review'],['hsk','compass','HSK'],['stem','flask-conical','STEM'],['pocket','grid-2x2','My Pocket'],['groups','folders','Groups']].map(([id,i,t])=>btn(icon(i)+t,'nav-'+id,'',state.panel===id?'aria-current="page"':'')).join('')}</nav>`;
 function stemHome(){return `<span class="hp-zh-label" lang="zh-Hans">理科中文</span><h1>A language<br>for discovery.</h1><p class="hp-lead">Scientific Chinese, in its own space.</p><div class="hp-switch" role="group" aria-label="STEM section">${btn('STEM subjects','tab-subjects','',`aria-pressed="${state.stemTab==='subjects'}"`)}${btn('CSCA preparation','tab-csca','',`aria-pressed="${state.stemTab==='csca'}"`)}</div>`+(state.stemTab==='subjects'?`<div class="hp-feature"><span class="hp-eyebrow">Listen, recall, reveal</span><h2>A new way to remember.</h2><p class="hp-small">Try dictation with mathematics vocabulary.</p>${btn(icon('volume-2')+'Try dictation','try-dictation')}</div><div class="hp-row hp-section-heading"><h2>The subjects</h2><span class="hp-small">STEM samples</span></div><div class="hp-grid">${subjects.map(d=>`<button class="hp-subject" data-action="deck-${d.id}"><span class="hp-subject-top"><span class="hp-subject-zh" lang="zh-Hans">${d.zh}</span>${icon(d.icon)}</span><h3>${d.name}</h3><small>${d.kind}</small><small>${d.ids.length} words</small></button>`).join('')}</div>`:`<span class="hp-eyebrow">CSCA · STEM Chinese</span><h2 style="margin-top:8px">Prepare by topic.</h2><p class="hp-lead">Vocabulary for scientific study and academic reading.</p>${paths.map((d,i)=>`<button class="hp-path" data-action="deck-${d.id}"><span class="hp-path-number">0${i+1}</span><span class="hp-path-copy"><h3>${d.name}</h3><p>${d.desc}</p><p>${d.ids.length} sample words</p></span>${icon('arrow-up-right')}</button>`).join('')}<p class="hp-note">Sample vocabulary practice, not a full mock exam.</p>`);}
 function hskHome(){return `<span class="hp-eyebrow">General Chinese · complete library</span><h1 style="margin-top:10px">A world of words.</h1><p class="hp-lead">All 3,600 HSK entries. New words first, with spaced revisits.</p>${hsk.map(d=>`<button class="hp-path" data-action="deck-${d.id}"><span class="hp-subject-zh" lang="zh-Hans">${d.zh}</span><span class="hp-path-copy"><h3>${d.name}</h3><p>${d.ids.length} entries · ${stats(d).seen} seen in ${state.mode==='normal'?'normal review':'dictation'}</p></span>${icon('arrow-up-right')}</button>`).join('')}`;}
 function galleryIds(){return state.panel==='pocket'?savedIds():deck()?.ids??[];}
 const searchKey=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s]/g,'');
 function galleryContent(){const n=searchKey(query),ids=galleryIds().filter(id=>{const w=byId.get(id);return searchKey(w.h+' '+w.p+' '+w.m).includes(n);});return `<div class="hp-row hp-gallery-tools"><span class="hp-small">${ids.length} words${selecting?' · '+selected.size+' selected':''}</span>${btn(selecting?'Done':'Select','select','hp-text')}</div>${selecting?btn('Add '+selected.size+' to collections','organize','hp-secondary',selected.size?'':'disabled'):''}<div class="hp-word-grid">${ids.slice(0,limit).map(id=>{const w=byId.get(id);return `<button class="hp-word-tile ${selected.has(id)?'selected':''} ${[...w.h].length>3?'hp-long-word':''}" data-action="word-${id}" aria-label="${selecting?'Select ':'Open '}${esc(w.h)}" ${selecting?`aria-pressed="${selected.has(id)}"`:''}><span lang="zh-Hans">${esc(w.h)}</span>${selecting?`<span class="hp-select-mark">${selected.has(id)?'✓':''}</span>`:''}</button>`;}).join('')}</div>${!ids.length?'<p class="hp-note">No words here yet. Save a word or add your own.</p>':''}${ids.length>limit?btn('Show more words','more','hp-secondary','style="margin-top:16px"'):''}`;}
 const gallery=()=>`<label class="hp-search">${icon('search')}<input type="search" aria-label="Search vocabulary" placeholder="Characters, pinyin, meaning" value="${esc(query)}"></label><div data-gallery>${galleryContent()}</div>`;
 function selectedDeck(){const d=deck(),s=stats(d);return `${btn(icon('arrow-left')+(state.panel==='hsk'?'All HSK levels':'Back to '+(state.stemTab==='csca'?'CSCA preparation':'STEM subjects')),'close-deck','hp-text hp-back')}<span class="hp-eyebrow">${esc(d.kind)}</span><h1 style="margin-top:9px">${esc(d.name)}</h1>${d.desc?`<p class="hp-lead">${esc(d.desc)}</p>`:''}${modePicker()}<div class="hp-counts"><div><strong>${s.fresh}</strong><span>New</span></div><div><strong>${s.missed}</strong><span>To revisit</span></div><div><strong>${s.seen}</strong><span>Seen in this mode</span></div></div>${btn(icon('play')+(s.seen?'Continue ':'Start ')+(state.mode==='dictation'?'dictation':'normal review'),'start','hp-primary','style="margin-top:18px"')}<div class="hp-row hp-section-heading"><h2>The character gallery</h2><span class="hp-small">${d.ids.length} entries</span></div>${gallery()}`;}
 function pocket(){const g=state.groups.find(g=>g.id===state.activeGroup),ids=savedIds();return `${g?btn(icon('arrow-left')+'All collections','nav-groups','hp-text hp-back'):''}<div class="hp-row"><h1>${esc(g?.name??'My Pocket')}.</h1>${btn(icon('plus'),'new-word','hp-icon','aria-label="Add your own word"')}</div><p class="hp-lead">${g?'Your personal selection. Practise only this category.':'HSK, STEM and your own words, in one personal library.'}</p><div class="hp-switch" role="group" aria-label="Pocket vocabulary source">${[['all','All'],['hsk','HSK'],['stem','STEM'],['personal','Personal']].map(([id,t])=>btn(t,'filter-'+id,'',`aria-pressed="${state.pocketFilter===id}"`)).join('')}</div>${modePicker()}${btn(icon('play')+(g?'Practise this collection':'Review My Pocket'),g?'start-group-'+g.id:'start-pocket','hp-primary',ids.length?'':'disabled')}<div class="hp-row hp-section-heading"><h2>Your collections</h2>${btn(icon('plus')+'New','new-group','hp-text')}</div><div class="hp-group-chips">${btn('All saved','group-all','hp-chip',g?'':'aria-pressed="true"')}${state.groups.map(v=>btn(esc(v.name),'group-'+v.id,'hp-chip',v.id===g?.id?'aria-pressed="true"':'')).join('')}</div>${g?btn('Add words from My Pocket','add-group-words-'+g.id,'hp-text'):''}<div class="hp-row hp-section-heading"><h2>${g?'In this collection':'Your character gallery'}</h2>${btn('Backup','backup','hp-text')}</div>${gallery()}`;}
 function cover(g){const ids=state.saved.filter(id=>(state.memberships[id]??[]).includes(g.id));return `<span class="hp-album-cover">${ids.length?ids.slice(0,4).map(id=>`<span lang="zh-Hans">${esc(byId.get(id).h)}</span>`).join(''):'<span lang="zh-Hans">集</span>'}</span>`;}
 function groups(){return `<div class="hp-row"><h1>Your collections.</h1>${btn(icon('plus'),'new-group','hp-icon','aria-label="Create collection"')}</div><p class="hp-lead">Mix HSK words, STEM terms and your own entries. A word can belong to several collections.</p>${state.groups.length?`<div class="hp-albums">${state.groups.map(g=>{const c=state.saved.filter(id=>(state.memberships[id]??[]).includes(g.id)).length;return `<article><button class="hp-album-open" data-action="group-${g.id}">${cover(g)}<h3>${esc(g.name)}</h3><span class="hp-small">${c} words</span></button><div class="hp-row">${btn(icon('play')+'Practise','start-group-'+g.id,'hp-text',c?'':'disabled')}${btn(icon('ellipsis'),'edit-group-'+g.id,'hp-icon',`aria-label="Edit ${esc(g.name)}"`)}</div></article>`;}).join('')}</div>`:`<div class="hp-empty"><span lang="zh-Hans">集</span><h2>Make it your collection.</h2><p>Class notes, travel, physics, favourite verbs.<br>Choose a name and start collecting.</p>${btn('Create a collection','new-group')}</div>`}`;}
 function review(){return `<span class="hp-eyebrow">Daily practice</span><h1 style="margin-top:10px">Your daily<br>Chinese ritual.</h1><p class="hp-lead">Your own words, with room to keep exploring.</p>${modePicker()}<div class="hp-feature"><span class="hp-eyebrow">My Pocket</span><h2>${state.saved.length} saved words</h2><p class="hp-small">Review your Pocket, then continue in your last HSK level.</p>${btn(icon('play')+'Start practice','review-pocket','hp-primary',state.saved.length?'':'disabled')}</div><div class="hp-row hp-section-heading"><h2>Your collections</h2>${btn('See all','nav-groups','hp-text')}</div>${state.groups.slice(0,3).map(g=>btn(esc(g.name),'group-'+g.id,'hp-secondary','style="margin-bottom:9px"')).join('')||btn('Create your first collection','new-group','hp-secondary')}<div class="hp-row hp-section-heading"><h2>Keep discovering</h2></div>${btn('HSK 1–5','nav-hsk','hp-secondary')}${btn('STEM & CSCA','nav-stem','hp-secondary','style="margin-top:10px"')}`;}
 function study(){
  const d=deck(),w=byId.get(ensureQueue()[0]);if(!w){state.study=false;return pocket();}const dict=state.mode==='dictation',s=stats(d),saved=state.saved.includes(w.id);
  const face=state.revealed?`<span class="hp-hanzi" lang="zh-Hans">${esc(w.h)}</span><span class="hp-pinyin">${esc(w.p)}</span><span class="hp-meaning">${esc(w.m)}</span>`:dict?`<span class="hp-pinyin">${esc(w.p)}</span><span class="hp-hidden-answer" aria-hidden="true">···</span><span class="hp-tap-label">Tap anywhere to reveal</span>`:`<span class="hp-hanzi" lang="zh-Hans">${esc(w.h)}</span><span class="hp-tap-label">Tap anywhere to reveal</span>`;
  return `<section class="hp-study" aria-label="${dict?'Dictation':'Normal'} practice"><header class="hp-study-header">${btn(icon('arrow-left'),'leave','hp-icon','aria-label="Leave practice"')}<div class="hp-study-title">${esc(d.name)}<small>${dict?'Dictation':'Normal review'} · ${s.fresh} new · ${s.missed} to revisit</small></div>${btn(icon(saved?'bookmark-check':'bookmark')+(saved?'Saved':'Save'),'save-current','hp-save',saved?'disabled':'')}</header><div class="hp-study-body"><span class="hp-prompt-type">${state.revealed?'The answer':dict?'Listen & recall the characters':'Recognise the characters'}</span><button class="hp-reveal ${state.revealed?'hp-answer':''}" data-action="reveal" aria-label="${state.revealed?esc(w.h+', '+w.p+', '+w.m):dict?esc(w.p+'. Reveal the characters'):'Reveal pinyin and meaning'}">${face}</button>${dict||state.revealed?`<div class="hp-audio">${btn(icon('volume-2')+'Listen','listen','hp-text')}${btn('Slow','slow','hp-text')}${dict&&!state.revealed?btn(state.hint?'Hide hint':'Meaning hint','hint','hp-text'):''}</div>`:''}${state.hint&&!state.revealed?`<p class="hp-small">${esc(w.m)}</p>`:''}${audioStatus?`<p class="hp-audio-status" role="status">${esc(audioStatus)}</p>`:''}${state.revealed&&w.zh?`<div class="hp-example"><span lang="zh-Hans">${esc(w.zh)}</span><p>${esc(w.en)}</p></div>`:''}${state.revealed?btn('Add to a collection','organize-current','hp-text'):''}</div><footer class="hp-study-footer"><p class="hp-study-hint">${state.revealed?'Swipe left if correct · right to revisit':'Recall first. Reveal when you’re ready.'}</p><div class="hp-answer-actions">${btn(icon('arrow-left')+'Correct','correct','hp-correct',state.revealed?'':'disabled')}${btn(icon('undo-2')+'Undo','undo','hp-undo',state.history.length?'':'disabled')}${btn('Incorrect'+icon('arrow-right'),'incorrect','hp-incorrect',state.revealed?'':'disabled')}</div></footer></section>`;
 }
 function checkboxes(ids=[]){return state.groups.length?state.groups.map(g=>`<label class="hp-check"><input type="checkbox" name="groups" value="${esc(g.id)}" ${ids.includes(g.id)?'checked':''}><span>${esc(g.name)}</span></label>`).join(''):'<p class="hp-small">Create a collection to organise your words.</p>';}
 function dialog(){
  if(!modal)return '';let title='',content='';
  if(modal==='detail'){
   const w=byId.get(detailId);if(!w)return '';title=sourceName(w)+' word';content=`<div class="hp-word-detail"><span class="hp-detail-hanzi" lang="zh-Hans">${esc(w.h)}</span><p class="hp-pinyin">${esc(w.p)}</p><p>${esc(w.m)}</p>${btn(icon(state.saved.includes(w.id)?'bookmark-check':'bookmark')+(state.saved.includes(w.id)?'Saved in My Pocket':'Save to My Pocket'),'save-'+w.id,'hp-primary',state.saved.includes(w.id)?'disabled':'')}</div><form data-form="assign"><fieldset><legend>Your collections</legend>${checkboxes(state.memberships[w.id]??[])}</fieldset>${btn(icon('plus')+'New collection','new-group','hp-text')}<p data-form-error role="alert"></p><button type="submit" class="hp-secondary">Save word and collections</button></form>`;
  }else if(modal==='organize'){
   title='Organize '+pendingIds.length+' words';content=`<form data-form="assign"><fieldset><legend>Add to collections</legend>${checkboxes(state.activeGroup?[state.activeGroup]:[])}</fieldset>${btn(icon('plus')+'New collection','new-group','hp-text')}<p data-form-error role="alert"></p><button type="submit" class="hp-primary" ${state.groups.length?'':'disabled'}>Save to selected collections</button></form>`;
  }else if(modal==='new-group'||modal==='edit-group'){
   const g=state.groups.find(g=>g.id===editingGroup);title=g?'Edit collection':'Create collection';content=`<form data-form="group"><label class="hp-field">Collection name<input name="name" required maxlength="80" value="${esc(g?.name??'')}" placeholder="e.g. Physics class"></label><p data-form-error role="alert"></p><button type="submit" class="hp-primary">${g?'Save name':'Create collection'}</button>${g?btn('Delete collection','delete-group','hp-text hp-danger'):''}</form>`;
  }else if(modal==='new-word'){
   title='Add your own word';content=`<form data-form="word"><label class="hp-field">Chinese characters<input name="hanzi" lang="zh-Hans" required maxlength="100"></label><label class="hp-field">Pinyin<input name="pinyin" required maxlength="300"></label><label class="hp-field">Meaning<textarea name="meaning" required maxlength="2000" rows="3"></textarea></label><fieldset><legend>Collections</legend>${checkboxes(state.activeGroup?[state.activeGroup]:[])}</fieldset><p data-form-error role="alert"></p><button type="submit" class="hp-primary">Save word</button></form>`;
  }
  return `<dialog class="hp-modal" aria-label="${esc(title)}"><div class="hp-row hp-modal-heading"><h2>${esc(title)}</h2>${btn(icon('x'),'close-modal','hp-icon','aria-label="Close dialog"')}</div>${content}</dialog>`;
 }
 function render(){
  if(state.study)app.innerHTML=study();else app.innerHTML=`<header class="hp-masthead"><span class="hp-brand">HANZI POCKET</span><span class="hp-preview">Preview · 9 Nov</span></header><main class="hp-main">${state.deck&&['hsk','stem'].includes(state.panel)?selectedDeck():state.panel==='stem'?stemHome():state.panel==='hsk'?hskHome():state.panel==='pocket'?pocket():state.panel==='groups'?groups():review()}</main>${nav()}<footer class="hp-credits">Preview · full HSK 1–5 + 32 STEM sample terms<br><a href="./DATA-ATTRIBUTION.txt">Data credits</a> · <a href="./HSK-LICENSE.txt">HSK license</a></footer>`;
  if(message)app.insertAdjacentHTML('beforeend',`<div class="hp-toaster" role="status">${esc(message)}</div>`);if(modal)app.insertAdjacentHTML('beforeend',dialog());
  app.querySelector('dialog')?.showModal();window.lucide?.createIcons({attrs:{width:18,height:18}});
 }
 function finish(){persist();render();}
 function stopAudio(){voiceRequest++;try{speechSynthesis.cancel();}catch{}}
 async function speak(slow=false){
  const w=byId.get(ensureQueue()[0]);if(!w)return;stopAudio();const request=voiceRequest;
  if(!('speechSynthesis'in window)){audioStatus='Speech is unavailable in this browser.';render();return;}
  let voices=speechSynthesis.getVoices();if(!voices.length)voices=await new Promise(resolve=>{const done=()=>{clearTimeout(timer);speechSynthesis.removeEventListener('voiceschanged',done);resolve(speechSynthesis.getVoices());};const timer=setTimeout(done,1200);speechSynthesis.addEventListener('voiceschanged',done);});
  if(request!==voiceRequest||!state.study||ensureQueue()[0]!==w.id)return;
  const voice=voices.find(v=>/^zh[-_]CN/i.test(v.lang)&&v.localService)??voices.find(v=>(/^zh[-_](TW|SG)/i.test(v.lang)||/^cmn/.test(v.lang))&&v.localService);
  if(!voice){audioStatus='Download a Mandarin voice in iPhone accessibility voice settings, then tap Listen again.';render();return;}
  const u=new SpeechSynthesisUtterance(w.h);u.voice=voice;u.lang=voice.lang;u.rate=slow?.55:.85;u.onerror=()=>{if(request===voiceRequest&&state.study){audioStatus='Audio could not play. Tap Listen to try again.';render();}};audioStatus='';speechSynthesis.speak(u);
 }
 function start(){if(!deck()?.ids.length){message='Add words to this collection first.';render();return;}stopAudio();state.study=true;state.revealed=false;state.hint=false;state.history=[];audioStatus='';if(deck().level)state.lastHskLevel=deck().level;ensureQueue();finish();if(state.mode==='dictation')void speak();}
 function ensureSaved(id){if(byId.has(id)&&!state.saved.includes(id))state.saved.push(id);}
 function save(id){ensureSaved(id);message='Saved to My Pocket · '+sourceName(byId.get(id));finish();}
 function answer(correct){
  if(!state.study||!state.revealed)return;const q=ensureQueue(),id=q[0],key=keyFor(id),k=queueKey();
  state.history.push({id,key,old:state.progress[key]??null,queue:[...q],queueKey:k,deck:state.deck,panel:state.panel,activeGroup:state.activeGroup,pocketFilter:state.pocketFilter});if(state.history.length>8)state.history.shift();
  state.progress[key]={correct,attempts:(state.progress[key]?.attempts??0)+1};q.shift();
  if(!q.length&&state.deck==='pocket'){state.panel='hsk';state.deck='hsk-'+state.lastHskLevel;state.activeGroup=null;message='My Pocket reviewed. Continuing in HSK '+state.lastHskLevel+'.';ensureQueue();}
  else if(!q.length)state.queues[k]=round(deck(),id);
  state.revealed=false;state.hint=false;audioStatus='';stopAudio();finish();if(state.mode==='dictation')void speak();
 }
 function resetView(){query='';limit=60;selecting=false;selected.clear();}
 function openGroup(id){state.activeGroup=id==='all'?null:id;state.panel='pocket';state.pocketFilter='all';state.deck=null;state.study=false;resetView();}
 app.addEventListener('input',e=>{if(e.target.matches('.hp-search input')){query=e.target.value;limit=60;app.querySelector('[data-gallery]').innerHTML=galleryContent();window.lucide?.createIcons({attrs:{width:18,height:18}});}});
 app.addEventListener('cancel',e=>{e.preventDefault();modal=null;render();},true);
 app.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action]'),a=button?.dataset.action;
  if(!a){if(state.study&&!modal&&!event.target.closest('button,input,textarea,select,a,dialog')&&Date.now()>=blockedUntil){state.revealed=true;finish();}return;}
  if(button.disabled)return;if(a==='reveal'){if(Date.now()<blockedUntil)return;state.revealed=true;finish();return;}message='';
  if(a.startsWith('nav-')){stopAudio();state.panel=a.slice(4);state.deck=null;state.study=false;state.activeGroup=null;state.history=[];modal=null;resetView();}
  else if(a.startsWith('tab-')){state.stemTab=a.slice(4);state.deck=null;resetView();}
  else if(a.startsWith('deck-')){state.deck=a.slice(5);state.study=false;resetView();}
  else if(a.startsWith('mode-')){state.mode=a.slice(5);state.history=[];}
  else if(a.startsWith('filter-')){state.pocketFilter=a.slice(7);state.deck=null;resetView();}
  else if(a.startsWith('start-group-')){state.deck='group:'+a.slice(12);start();return;}
  else if(a.startsWith('group-'))openGroup(a.slice(6));
  else if(a.startsWith('edit-group-')){editingGroup=a.slice(11);modal='edit-group';pendingIds=[];detailId=null;}
  else if(a.startsWith('add-group-words-')){const id=a.slice(16);openGroup('all');state.activeGroup=null;selecting=true;editingGroup=id;message='Select words, then add them to your collection.';}
  else if(a==='new-group'){editingGroup=null;if(modal==='detail')pendingIds=[detailId];else if(modal!=='organize'){pendingIds=[];detailId=null;}modal='new-group';}
  else if(a==='new-word'){modal='new-word';detailId=null;pendingIds=[];}
  else if(a==='close-modal'){modal=null;pendingIds=[];}
  else if(a==='try-dictation'){state.deck='math';state.mode='dictation';start();return;}
  else if(a==='start'){start();return;}
  else if(a==='start-pocket'||a==='review-pocket'){if(a==='review-pocket'){state.activeGroup=null;state.pocketFilter='all';}state.deck='pocket';start();return;}
  else if(a==='close-deck'){state.deck=null;resetView();}
  else if(a==='leave'){stopAudio();state.study=false;state.revealed=false;state.history=[];audioStatus='';if(state.deck==='pocket'||state.deck?.startsWith('group:')){state.panel='pocket';state.deck=null;}}
  else if(a==='listen'||a==='slow'){void speak(a==='slow');return;}
  else if(a==='hint')state.hint=!state.hint;
  else if(a==='correct'||a==='incorrect'){answer(a==='correct');return;}
  else if(a==='save-current'){save(ensureQueue()[0]);return;}
  else if(a.startsWith('save-')){save(a.slice(5));return;}
  else if(a.startsWith('word-')){const id=a.slice(5);if(selecting){selected.has(id)?selected.delete(id):selected.add(id);}else{detailId=id;pendingIds=[id];modal='detail';}}
  else if(a==='select'){selecting=!selecting;if(!selecting)selected.clear();}
  else if(a==='more')limit+=60;
  else if(a==='organize'){pendingIds=[...selected];detailId=null;modal='organize';}
  else if(a==='organize-current'){pendingIds=[ensureQueue()[0]];detailId=null;modal='organize';}
  else if(a==='undo'){
   const s=state.history.pop();if(!s)return;stopAudio();if(s.old)state.progress[s.key]=s.old;else delete state.progress[s.key];state.queues[s.queueKey]=s.queue;Object.assign(state,{deck:s.deck,panel:s.panel,activeGroup:s.activeGroup,pocketFilter:s.pocketFilter,revealed:false,hint:false});audioStatus='';finish();if(state.mode==='dictation')void speak();return;
  }else if(a==='delete-group'){
   if(!confirm('Delete this collection? Your words and learning progress will be kept.'))return;state.groups=state.groups.filter(g=>g.id!==editingGroup);for(const id of Object.keys(state.memberships))state.memberships[id]=state.memberships[id].filter(g=>g!==editingGroup);if(state.activeGroup===editingGroup)state.activeGroup=null;modal=null;message='Collection deleted. Words and progress kept.';
  }else if(a==='backup'){
   const blob=new Blob([JSON.stringify({format:'hanzi-pocket-preview',version:2,state:{...state,history:[]}},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='hanzi-pocket-preview-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
  }
  finish();
 });
 app.addEventListener('submit',event=>{
  const form=event.target;if(!form.dataset.form)return;event.preventDefault();const f=new FormData(form),groupIds=f.getAll('groups').map(String).filter(id=>state.groups.some(g=>g.id===id));
  try{
   if(form.dataset.form==='group'){
    const name=String(f.get('name')??'').trim();if(!name||name.length>80)throw new Error('Enter a collection name between 1 and 80 characters.');
    if(editingGroup){const g=state.groups.find(g=>g.id===editingGroup);if(!g)throw new Error('This collection no longer exists.');g.name=name;}
    else{const id=crypto.randomUUID();state.groups.push({id,name});for(const wid of pendingIds){ensureSaved(wid);state.memberships[wid]=[...new Set([...(state.memberships[wid]??[]),id])];}}
    modal=detailId?'detail':null;pendingIds=[];selected.clear();selecting=false;message='Collection saved.';
   }else if(form.dataset.form==='assign'){
    const ids=detailId?[detailId]:pendingIds;if(!detailId&&!groupIds.length)throw new Error('Choose at least one collection.');
    for(const id of ids){ensureSaved(id);state.memberships[id]=detailId?groupIds:[...new Set([...(state.memberships[id]??[]),...groupIds])];}
    modal=null;pendingIds=[];selected.clear();selecting=false;message='Words saved. Their learning progress is unchanged.';
   }else if(form.dataset.form==='word'){
    const h=String(f.get('hanzi')??'').normalize('NFKC').trim().replace(/\s+/g,''),p=String(f.get('pinyin')??'').trim(),m=String(f.get('meaning')??'').trim();
    if(!h||h.length>100||!/[\p{Script=Han}]/u.test(h)||!p||p.length>300||!m||m.length>2000)throw new Error('Enter Chinese characters, pinyin and a meaning.');
    let w=words.find(w=>w.h===h&&w.p===p);if(!w){w={id:'personal-'+crypto.randomUUID(),h,p,m,zh:'',en:'',source:'personal'};words.push(w);byId.set(w.id,w);state.customWords.push(w);}
    ensureSaved(w.id);state.memberships[w.id]=[...new Set([...(state.memberships[w.id]??[]),...groupIds])];modal=null;message='Word saved to My Pocket.';
   }
   finish();
  }catch(e){form.querySelector('[data-form-error]').textContent=e.message;}
 });
 app.addEventListener('pointerdown',e=>{if(!state.study||!state.revealed||modal||e.button!==0||e.target.closest('button:not(.hp-reveal),a,input,select,textarea,dialog'))return;drag={x:e.clientX,y:e.clientY,id:e.pointerId,horizontal:false};});
 app.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.horizontal&&Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.2){drag.horizontal=true;app.setPointerCapture?.(e.pointerId);blockedUntil=Date.now()+500;}if(drag.horizontal){const face=app.querySelector('.hp-reveal');if(face)face.style.transform=`translateX(${dx}px) rotate(${dx/35}deg)`;}});
 app.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,h=drag.horizontal;drag=null;if(h)blockedUntil=Date.now()+450;if(h&&Math.abs(dx)>75)answer(dx<0);else{const face=app.querySelector('.hp-reveal');if(face)face.style.transform='';}});
 app.addEventListener('pointercancel',()=>{drag=null;const face=app.querySelector('.hp-reveal');if(face)face.style.transform='';});
 window.addEventListener('pagehide',stopAudio);window.speechSynthesis?.getVoices();restore();render();
})().catch(error=>{const view=document.querySelector('[data-demo-app]');view.replaceChildren();const text=document.createElement('p');text.textContent=error.message;const retry=document.createElement('button');retry.textContent='Reload';retry.onclick=()=>location.reload();view.append(text,retry);});
