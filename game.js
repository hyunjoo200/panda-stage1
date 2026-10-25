/* 중국어 탐험대 STAGE 01 · 대나무 언덕의 비밀 — 게임 프로그램 (game.js)
   문제·점수·지도는 game-data.js에서 고치세요. 이 파일은 고치지 않아도 됩니다. */
(() => {
'use strict';
const D = window.GAME_DATA, L = D.level;
const $ = s => document.querySelector(s);
const STORE_KEY = 'panda-stage1-v2', PREF_KEY = 'panda-stage1-prefs';
const MISSIONS = D.missions, ALL = [...MISSIONS, D.bonus];
const TONE_OF = { ma1:1, ma2:2, ma3:3, ma4:4 }, TONE_IDS = ['ma1','ma2','ma3','ma4'];
const TONE_DESC = { 1:'높고 평평하게', 2:'아래에서 위로', 3:'내려갔다 올라가게', 4:'위에서 아래로 뚝' };
const GROUND = L.ground, VH = 540;

/* ================= 저장 (이 기기) ================= */
const store = {
  load(){ try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch(e){ return null; } },
  save(s){ try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); return true; } catch(e){ return false; } }
};
let prefs = { bgm:45, sfx:70, voice:100, mute:false };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch(e){}
const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch(e){} };
const emptyRec = () => ({ first:null, firstCorrect:null, tries:0, wrongs:[], points:0, done:false, doneAt:null, target:null });
function newState(name){
  const results = {}; ALL.forEach(m => results[m.id] = emptyRec());
  return { name, tag:String(Math.floor(1000 + Math.random()*9000)), startedAt:Date.now(), learn:0, starPts:0, bumps:0,
           starsTaken:[], results, items:[], gateOpen:false, finished:false, finishedAt:null, x:L.start };
}
let S = null;
const persist = () => { if (S) store.save(S); };

/* ================= 소리 ================= */
const Snd = (() => {
  let ctx = null, master, bgmGain, sfxGain, duck = 1, bgmOn = false, nextNote = 0, step = 0;
  const bad = {}; let lastSource = '';
  function ensure(){
    if (ctx){ if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    bgmGain = ctx.createGain(); bgmGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.connect(master);
    apply();
  }
  function apply(){
    if (!ctx) return; const t = ctx.currentTime;
    master.gain.setTargetAtTime(prefs.mute ? 0 : 1, t, .05);
    bgmGain.gain.setTargetAtTime(prefs.bgm/100 * .22 * duck, t, .15);
    sfxGain.gain.setTargetAtTime(prefs.sfx/100 * .6, t, .05);
  }
  const setDuck = d => { duck = d; apply(); };
  function tone(f, start, dur, type='sine', vol=.3, dest=sfxGain, atk=.01){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, start);
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + atk);
    g.gain.exponentialRampToValueAtTime(.0008, start + dur);
    o.connect(g); g.connect(dest); o.start(start); o.stop(start + dur + .05); return o;
  }
  const hz = n => 440 * Math.pow(2, (n - 69)/12);
  // 배경음악: 오음계로 만든 짧은 반복 곡 (코드로 직접 생성, 저작권 문제 없음)
  const MEL = [76,79,81,79, 76,74,72,74, 76,79,84,81, 79,76,74,-1, 72,74,76,79, 81,79,76,74, 72,76,74,72, 69,72,74,-1];
  const BASS = [48,55,45,52, 48,55,43,50];
  function schedule(){
    if (!ctx || !bgmOn) return;
    const spb = 60/112/2;
    while (nextNote < ctx.currentTime + .25){
      const n = MEL[step % MEL.length];
      if (n > 0) tone(hz(n), nextNote, spb*1.6, 'triangle', .17, bgmGain, .02);
      if (step % 4 === 0) tone(hz(BASS[(step/4) % BASS.length]), nextNote, spb*3.6, 'sine', .22, bgmGain, .03);
      if (step % 2 === 1) tone(hz(96), nextNote, .05, 'square', .012, bgmGain, .002);
      nextNote += spb; step++;
    }
  }
  function startBgm(){ ensure(); if (!ctx || bgmOn) return; bgmOn = true; nextNote = ctx.currentTime + .1; setInterval(schedule, 90); }
  const fx = (fn) => () => { ensure(); if (ctx) fn(ctx.currentTime); };
  const sfx = {
    correct: fx(t => { [72,76,79,84].forEach((n,i) => tone(hz(n), t+i*.07, .35, 'triangle', .25)); tone(hz(96), t+.3, .5, 'sine', .12); }),
    wrong:   fx(t => { tone(hz(64), t, .18, 'sine', .18); tone(hz(60), t+.12, .25, 'sine', .15); }),
    bell:    fx(t => { [[523,.3],[1046,.14],[1568,.08],[2093,.05]].forEach(([f,v]) => tone(f, t, 2.2, 'sine', v, sfxGain, .003)); }),
    star:    fx(t => { tone(hz(88), t, .08, 'square', .05); tone(hz(93), t+.06, .14, 'square', .05); }),
    jump:    fx(t => { const o = tone(300, t, .16, 'sine', .1); o.frequency.exponentialRampToValueAtTime(620, t+.14); }),
    bump:    fx(t => { const o = tone(220, t, .25, 'triangle', .14); o.frequency.exponentialRampToValueAtTime(110, t+.22); }),
    stomp:   fx(t => { tone(hz(67), t, .1, 'square', .07); tone(hz(74), t+.08, .12, 'square', .07); }),
    door:    fx(t => { tone(hz(48), t, 1.2, 'sawtooth', .05); [60,64,67,72,76].forEach((n,i) => tone(hz(n), t+.25+i*.12, .8, 'triangle', .16)); }),
    bonus:   fx(t => { [79,83,86,91,95].forEach((n,i) => tone(hz(n), t+i*.06, .3, 'sine', .18)); }),
    fanfare: fx(t => { [[72,0],[76,.15],[79,.3],[84,.45],[79,.7],[84,.85]].forEach(([n,d]) => tone(hz(n), t+d, .5, 'triangle', .22)); }),
    blip:    fx(t => tone(hz(88), t, .06, 'sine', .08))
  };
  // 중국어 음성: ① 녹음 파일 → ② 온라인 음성 → ③ 기기 내장 음성
  // 휴대폰 브라우저는 화면을 누르기 전에는 소리를 막아요. 그래서 첫 터치 때 재생기 하나를 '깨워 두고' 계속 다시 씁니다.
  const SILENT = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  const voiceEl = new Audio(); voiceEl.preload = 'auto';
  try { voiceEl.preservesPitch = true; voiceEl.webkitPreservesPitch = true; } catch(e){}
  let unlocked = false; const diag = {};
  function unlock(){
    ensure();
    if (ctx){ try { const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(0); } catch(e){} }
    if (unlocked) return; unlocked = true;
    try {
      voiceEl.muted = true; voiceEl.src = SILENT;
      const p = voiceEl.play();
      if (p && p.then) p.then(() => { voiceEl.pause(); voiceEl.muted = false; diag.unlock = 'ok'; }).catch(err => { voiceEl.muted = false; unlocked = false; diag.unlock = err && err.name; });
    } catch(e){ unlocked = false; }
    try { if (window.speechSynthesis){ const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); } } catch(e){}
  }
  ['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture:true, passive:true }));
  const errKind = err => !err ? 'load' : err.name === 'NotAllowedError' ? 'blocked' : err.name === 'AbortError' ? 'abort' : 'load';
  function playUrl(url, rate){
    return new Promise((res, rej) => {
      const a = voiceEl; let started = false, done = false;
      const fin = (fn, v) => { if (done) return; done = true; clearTimeout(to); a.onerror = a.onended = a.onplaying = null; fn(v); };
      const fail = kind => { const e = new Error(kind); e.kind = kind; return e; };
      const to = setTimeout(() => { if (!started){ try { a.pause(); } catch(e){} fin(rej, fail('timeout')); } }, 6000);
      try { a.pause(); } catch(e){}
      a.muted = false; a.volume = prefs.mute ? 0 : prefs.voice/100;
      a.onerror = () => fin(rej, fail('load'));
      a.onended = () => fin(res);
      a.onplaying = () => { started = true; clearTimeout(to); a.playbackRate = rate; };
      a.src = url; a.defaultPlaybackRate = rate; a.playbackRate = rate;
      const p = a.play();
      if (p && p.catch) p.catch(err => fin(rej, fail(errKind(err))));
    });
  }
  function synth(text, rate){
    return new Promise((res, rej) => {
      const ss = window.speechSynthesis; if (!ss) return rej(new Error('nosynth'));
      const vs = ss.getVoices();
      const v = vs.find(v => /zh[-_]CN/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || vs.find(v => /cmn/i.test(v.lang));
      if (!v && vs.length) return rej(new Error('novoice'));
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; if (v) u.voice = v; u.rate = rate < 1 ? .55 : .85; u.volume = prefs.mute ? 0 : prefs.voice/100;
      u.onend = () => res(); u.onerror = e => rej(e);
      ss.cancel(); ss.speak(u); setTimeout(res, 4000);
    });
  }
  let busy = Promise.resolve();
  async function say(id, slow=false){
    const s = D.audio.sounds[id]; if (!s) return;
    ensure(); setDuck(.12);
    const rate = slow ? (D.audio.slowRate || .7) : 1;
    const blockedErr = () => { lastSource = 'blocked'; const e = new Error('blocked'); e.kind = 'blocked'; return e; };
    try {
      if (D.audio.useLocalFiles && !bad[id]){
        try { await playUrl(s.file, rate); lastSource = 'file'; diag.file = 'ok'; return; }
        catch(e){ diag.file = e.kind; if (e.kind === 'blocked') throw blockedErr(); if (e.kind === 'load') bad[id] = true; }
      }
      if (D.audio.useOnlineVoice && D.audio.onlineVoiceUrl && !bad.online){
        try { await playUrl(D.audio.onlineVoiceUrl + encodeURIComponent(s.text), rate); lastSource = 'online'; diag.online = 'ok'; return; }
        catch(e){ diag.online = e.kind; if (e.kind === 'blocked') throw blockedErr(); if (e.kind === 'load') bad.online = true; }
      }
      await synth(s.text, rate); lastSource = 'device'; diag.device = 'ok';
    } catch(e){ if (e.kind !== 'blocked'){ lastSource = 'fail'; diag.device = diag.device || (e && (e.message || e.error)) || 'fail'; } throw e; }
    finally { setTimeout(() => setDuck(1), 250); }
  }
  const sayQ = (id, slow) => (busy = busy.catch(() => {}).then(() => say(id, slow)));
  async function saySeq(ids, slow){ for (const id of ids){ await sayQ(id, slow); await new Promise(r => setTimeout(r, 380)); } }
  const retry = () => Object.keys(bad).forEach(k => delete bad[k]);
  if (window.speechSynthesis) window.speechSynthesis.getVoices();
  return { ensure, unlock, apply, startBgm, sfx, say:sayQ, saySeq, retry, source:() => lastSource, diag:() => ({ ...diag }) };
})();
const SOURCE_TEXT = {
  file:   ['녹음 파일로 재생 중', true],
  online: ['임시 음성(온라인 자동 음성, 성조 검수 전)', false],
  device: ['임시 음성(기기 내장 음성, 성조 검수 전)', false],
  blocked:['휴대폰이 자동 재생을 막았어요. ▶ 듣기를 눌러 주세요.', false],
  fail:   ['소리를 재생하지 못했어요. 무음 모드와 음량을 확인하고 ↻ 다시를 눌러 주세요.', false]
};
function sourceBadge(){
  const v = SOURCE_TEXT[Snd.source()]; if (!v) return '';
  return `<span class="badge-temp ${v[1] ? 'badge-ok' : ''}">${v[1] ? '✔' : '⚠'} ${v[0]}</span>`;
}

/* ================= 그림 조각 (성조 그림, 종 아이콘, 판다 얼굴) ================= */
function contourSVG(tone, cls='contour', color='#25845f'){
  const X = x => 10 + x*80, Y = l => 52 - (l-1)*10;
  const d = { 1:`M${X(0)} ${Y(5)} L${X(1)} ${Y(5)}`, 2:`M${X(0)} ${Y(3)} L${X(1)} ${Y(5)}`,
              3:`M${X(0)} ${Y(2)} Q${X(.35)} ${Y(.2)} ${X(.5)} ${Y(1.1)} T${X(1)} ${Y(4)}`, 4:`M${X(0)} ${Y(5)} L${X(1)} ${Y(1)}` }[tone];
  const grid = [1,2,3,4,5].map(l => `<line x1="6" x2="94" y1="${Y(l)}" y2="${Y(l)}" stroke="#dbe6d6" stroke-width="1"/>`).join('');
  return `<svg class="${cls}" viewBox="0 0 100 60" aria-hidden="true">${grid}<path d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const bellSVG = done => { const c = done ? '#e3ad1f' : 'rgba(255,255,255,.28)';
  return `<svg viewBox="0 0 24 24"><path d="M12 3a1.5 1.5 0 0 1 1.5 1.5v.4A6 6 0 0 1 18 11v4l2 2.5H4L6 15v-4a6 6 0 0 1 4.5-6.1v-.4A1.5 1.5 0 0 1 12 3z" fill="${c}"/><circle cx="12" cy="20" r="2" fill="${c}"/></svg>`; };
const pandaFaceSVG = () => `<svg viewBox="0 0 84 80" aria-hidden="true"><circle cx="18" cy="16" r="10" fill="#1b2620"/><circle cx="66" cy="16" r="10" fill="#1b2620"/>
  <ellipse cx="42" cy="42" rx="31" ry="29" fill="#fff" stroke="#1b2620" stroke-width="2"/>
  <ellipse cx="29" cy="38" rx="8" ry="10" transform="rotate(-25 29 38)" fill="#1b2620"/><ellipse cx="55" cy="38" rx="8" ry="10" transform="rotate(25 55 38)" fill="#1b2620"/>
  <circle cx="30" cy="37" r="3" fill="#fff"/><circle cx="54" cy="37" r="3" fill="#fff"/><ellipse cx="42" cy="47" rx="4" ry="3" fill="#1b2620"/>
  <ellipse cx="42" cy="54" rx="3.5" ry="2.5" fill="#1b2620"/><path d="M20 66q22 10 44 0" stroke="#25845f" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;

/* ================= 캔버스 ================= */
const canvas = $('#game'), ctx = canvas.getContext('2d');
let VW = 960, scale = 1, dpr = 1, cam = 0;
function resize(){
  const st = $('#stage').getBoundingClientRect();
  if (!st.width || !st.height) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  VW = Math.max(560, Math.min(1100, VH * st.width / st.height));
  scale = Math.min(st.width / VW, st.height / VH);
  canvas.style.width = Math.round(VW*scale) + 'px'; canvas.style.height = Math.round(VH*scale) + 'px';
  canvas.width = Math.round(VW*scale*dpr); canvas.height = Math.round(VH*scale*dpr);
}
const E = (g,x,y,rx,ry,rot=0) => { g.beginPath(); g.ellipse(x,y,rx,ry,rot,0,Math.PI*2); g.fill(); };
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function starShape(g,x,y,r,spin=1){
  g.save(); g.translate(x,y); g.scale(spin,1); g.beginPath();
  for (let i=0;i<10;i++){ const a = -Math.PI/2 + i*Math.PI/5, rad = i%2 ? r*.45 : r; g.lineTo(Math.cos(a)*rad, Math.sin(a)*rad); }
  g.closePath(); g.fill(); g.stroke(); g.restore();
}

/* ================= 판다 (옆모습) ================= */
const P = { x:0, y:0, w:40, h:54, vx:0, vy:0, kx:0, onGround:true, face:1, phase:0, joy:0, invuln:0, coyote:0, jumpBuf:0 };
function drawPanda(g, cx, by, f, moving, inAir, joy, blink){
  g.save(); g.translate(cx, by);
  if (blink) g.globalAlpha = .4;
  g.fillStyle = 'rgba(0,0,0,.18)'; if (!inAir) E(g, 0, 2, 22, 5);
  const jumpY = joy > 0 ? -Math.abs(Math.sin(joy*9))*14 : 0;
  g.translate(0, jumpY); g.scale(f, 1);
  const sw = moving && !inAir ? Math.sin(P.phase) * 7 : 0;
  // 다리
  g.fillStyle = '#1b2620';
  if (inAir){ rr(g,-14,-16,12,12,5); g.fill(); rr(g,4,-18,12,12,5); g.fill(); }
  else { rr(g,-14+sw*.6,-14,12,14,5); g.fill(); rr(g,3-sw*.6,-14,12,14,5); g.fill(); }
  // 몸
  g.fillStyle = '#fff'; g.strokeStyle = '#1b2620'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(0,-27,18,17,0,0,Math.PI*2); g.fill(); g.stroke();
  g.fillStyle = '#1b2620'; g.save(); g.translate(5,-28); g.rotate(inAir ? -1.1 : sw*.05); rr(g,-5,-4,10,20,5); g.fill(); g.restore();
  g.fillStyle = '#25845f'; rr(g,-14,-44,30,7,3); g.fill();
  // 머리
  g.fillStyle = '#1b2620'; E(g,-8,-70,7,7); E(g,10,-71,7,7);
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(3,-56,18,16,0,0,Math.PI*2); g.fill(); g.stroke();
  g.fillStyle = '#1b2620'; E(g,11,-58,5,6.5,.4); E(g,-3,-58,4,5.5,-.3);
  g.fillStyle = '#fff'; E(g,12,-59,1.8,1.8); E(g,-2.5,-59,1.5,1.5);
  g.fillStyle = '#1b2620'; E(g,19,-51,3,2.2);
  if (joy > 0){ g.strokeStyle = '#1b2620'; g.lineWidth = 1.8; g.beginPath(); g.arc(14,-48,3.5,.2,Math.PI-.2); g.stroke(); }
  // 잎사귀 모자
  g.fillStyle = '#7bb85a'; g.beginPath(); g.moveTo(-2,-71); g.quadraticCurveTo(10,-90,24,-80); g.quadraticCurveTo(10,-73,-2,-71); g.fill();
  g.restore();
}

/* ================= 세계 그리기 ================= */
const friends = L.friends.map((f,i) => ({ ...f, x:(f.from + f.to)/2, dir: i%2 ? 1 : -1, w:42, h:40, stun:0 }));
let particles = [];
const rnd = k => { const s = Math.sin(k*127.1)*43758.5453; return s - Math.floor(s); };
function drawSky(g, t){
  const sky = g.createLinearGradient(0,0,0,VH); sky.addColorStop(0,'#8fd3e6'); sky.addColorStop(.62,'#e8f6d8'); sky.addColorStop(1,'#cfe7b8');
  g.fillStyle = sky; g.fillRect(0,0,VW,VH);
  g.fillStyle = 'rgba(255,244,200,.9)'; E(g, VW-120, 90, 34, 34);
  // 구름
  g.fillStyle = 'rgba(255,255,255,.85)';
  for (let i=0;i<8;i++){ const x = ((i*310 + 60 - cam*.08) % (VW+300) + VW+300) % (VW+300) - 150, y = 70 + (i%3)*40;
    E(g,x,y,46,18); E(g,x+30,y-10,30,16); E(g,x-28,y+2,26,12); }
  // 먼 산
  g.fillStyle = '#b5d4b8';
  g.beginPath(); g.moveTo(0,VH);
  for (let x=-200; x<=VW+200; x+=40){ const wx = x + cam*.2; g.lineTo(x - (cam*.2 % 40), 320 - Math.abs(Math.sin(wx/260))*90 - Math.sin(wx/90)*14); }
  g.lineTo(VW,VH); g.closePath(); g.fill();
  // 중간 대나무 숲
  const off = cam*.5;
  for (let i=-2;i<Math.ceil(VW/46)+3;i++){
    const k = Math.floor(off/46) + i, x = k*46 - off, h = 150 + rnd(k)*110;
    g.fillStyle = '#86b886'; g.fillRect(x, GROUND - h, 9, h);
    g.fillStyle = '#9cc79a'; for (let y = GROUND - h + 22; y < GROUND; y += 34) g.fillRect(x-1, y, 11, 2);
    g.fillStyle = '#79ad78'; E(g, x-10, GROUND - h + 10, 16, 5, -.5); E(g, x+18, GROUND - h + 22, 16, 5, .5);
  }
}
function drawGround(g){
  g.fillStyle = '#6aa857'; g.fillRect(-cam % 1, GROUND, VW+2, VH-GROUND);
  g.fillStyle = '#5a9a4a'; g.fillRect(0, GROUND, VW, 10);
  g.fillStyle = '#8a6a43'; g.fillRect(0, GROUND+30, VW, VH-GROUND-30);
  g.fillStyle = '#d9d2bd';
  const off = cam % 70;
  for (let x=-off; x<VW+70; x+=70){ rr(g, x+6, GROUND+12, 50, 14, 6); g.fill(); }
  g.fillStyle = '#7a5c39'; for (let x=-off*1.0; x<VW+70; x+=70) g.fillRect(x+30, GROUND+50, 18, 4);
  // 풀
  g.strokeStyle = '#4f8d40'; g.lineWidth = 2;
  for (let x = -(cam % 24); x < VW; x += 24){ g.beginPath(); g.moveTo(x, GROUND+2); g.lineTo(x+4, GROUND-7); g.moveTo(x+6, GROUND+2); g.lineTo(x+9, GROUND-5); g.stroke(); }
}
function drawPlatform(g, p){
  const x = p.x - cam; if (x > VW+50 || x + p.w < -50) return;
  g.fillStyle = 'rgba(0,0,0,.12)'; E(g, x + p.w/2, GROUND + 4, p.w*.4, 5);
  g.strokeStyle = '#6b4b2e'; g.lineWidth = 4; g.beginPath(); g.moveTo(x+14, p.y+12); g.lineTo(x+20, GROUND); g.moveTo(x+p.w-14, p.y+12); g.lineTo(x+p.w-20, GROUND); g.stroke();
  for (let k=0;k<2;k++){ g.fillStyle = k ? '#7cae4f' : '#94c86a'; rr(g, x, p.y + k*9, p.w, 10, 5); g.fill(); }
  g.fillStyle = '#4e8a3a'; for (let xx = x + 22; xx < x + p.w - 6; xx += 32) g.fillRect(xx, p.y, 3, 18);
  g.fillStyle = '#c99b5b'; g.fillRect(x+8, p.y+4, 6, 10); g.fillRect(x+p.w-14, p.y+4, 6, 10);
}
function drawStar(g, x, y, t){
  g.fillStyle = '#ffd34d'; g.strokeStyle = '#b98510'; g.lineWidth = 2;
  starShape(g, x - cam, y + Math.sin(t/300 + x)*3, 13, Math.max(.2, Math.abs(Math.cos(t/500 + x/90))));
}
function drawBell(g, b, done, t, near){
  const x = b.x - cam; if (x < -120 || x > VW+120) return;
  const y = GROUND;
  if (!done){ const p = (Math.sin(t/300)+1)/2; g.fillStyle = `rgba(255,240,170,${.25 + p*.35})`; E(g, x, y-70, 62 + p*8, 62 + p*8); }
  // 기둥과 지붕
  g.fillStyle = '#8a3a2c'; g.fillRect(x-44, y-128, 9, 128); g.fillRect(x+35, y-128, 9, 128);
  g.fillStyle = '#b23a32'; g.beginPath(); g.moveTo(x-62, y-124); g.quadraticCurveTo(x, y-150, x+62, y-124); g.lineTo(x+52, y-136); g.quadraticCurveTo(x, y-160, x-52, y-136); g.closePath(); g.fill();
  g.fillStyle = '#6b4b2e'; g.fillRect(x-40, y-122, 80, 7);
  // 종
  const sw = near ? Math.sin(t/110)*.2 : Math.sin(t/700)*.05;
  g.save(); g.translate(x, y-115); g.rotate(sw);
  const body = done ? '#e3ad1f' : '#9a8c6d', dark = done ? '#b8860b' : '#6f6449';
  g.fillStyle = dark; g.fillRect(-3,0,6,10);
  g.fillStyle = body; g.beginPath(); g.moveTo(-17,12); g.quadraticCurveTo(-20,48,-28,62); g.lineTo(28,62); g.quadraticCurveTo(20,48,17,12); g.quadraticCurveTo(0,3,-17,12); g.fill();
  g.fillStyle = dark; g.fillRect(-28,58,56,5); E(g,0,68,5,5);
  g.restore();
  // 말풍선
  if (!done){
    const by = y - 182 + Math.sin(t/260)*4;
    g.fillStyle = '#fff'; rr(g, x-22, by-20, 44, 34, 12); g.fill();
    g.beginPath(); g.moveTo(x-6, by+14); g.lineTo(x, by+22); g.lineTo(x+6, by+14); g.fill();
    g.fillStyle = '#25845f'; g.font = '700 22px "Do Hyeon", sans-serif'; g.textAlign = 'center'; g.fillText('?', x, by+5);
  } else {
    g.fillStyle = '#fff6c9'; g.strokeStyle = '#e3ad1f'; g.lineWidth = 1.5; starShape(g, x+30, y-150 + Math.sin(t/220)*3, 9);
  }
  const m = MISSIONS.find(m => m.id === b.id);
  g.fillStyle = 'rgba(22,57,44,.75)'; g.font = '15px "Gowun Dodum", sans-serif'; g.textAlign = 'center';
  rr(g, x - 52, y + 36, 104, 24, 10); g.fill(); g.fillStyle = '#fff'; g.fillText(m.place, x, y + 53);
}
function drawBonusBox(g, t){
  const bx = L.bonusBox; const x = bx.x - cam, y = bx.y; if (x < -80 || x > VW+80) return;
  const done = S.results.bonus.done;
  if (!done){ const p = (Math.sin(t/350)+1)/2; g.fillStyle = `rgba(255,240,170,${.2+p*.35})`; E(g, x, y-22, 40, 34); }
  g.fillStyle = '#8a5a32'; rr(g, x-24, y-30, 48, 30, 5); g.fill();
  g.fillStyle = '#5d3a1f'; g.fillRect(x-24, y-20, 48, 3);
  if (done){ g.fillStyle = '#e3ad1f'; g.fillRect(x-4, y-62, 8, 36); g.fillStyle = '#a8743f'; rr(g, x-26, y-44, 52, 12, 5); g.fill(); }
  else { g.fillStyle = '#9b6838'; rr(g, x-26, y-42, 52, 16, 5); g.fill(); g.fillStyle = '#e3ad1f'; g.fillRect(x-5, y-32, 10, 10); }
}
function drawFriend(g, f, t){
  const x = f.x - cam, y = GROUND; if (x < -60 || x > VW+60) return;
  g.fillStyle = 'rgba(0,0,0,.18)'; E(g, x, y+2, 20, 4);
  if (f.stun > 0){
    g.fillStyle = '#f3e6cf'; rr(g, x-16, y-14, 32, 14, 6); g.fill();
    g.fillStyle = '#d9503f'; E(g, x, y-14, 24, 10);
    g.fillStyle = '#fff'; E(g, x-8, y-17, 4, 3); E(g, x+9, y-15, 3, 2);
    g.fillStyle = '#ffd34d'; g.strokeStyle = '#b98510'; g.lineWidth = 1;
    for (let i=0;i<3;i++){ const a = t/200 + i*2.1; starShape(g, x + Math.cos(a)*18, y - 34 + Math.sin(a)*5, 5); }
    return;
  }
  const hop = Math.abs(Math.sin(t/160 + f.from))*3;
  g.fillStyle = '#1b2620'; E(g, x-9, y-3, 6, 4); E(g, x+9, y-3, 6, 4);
  g.fillStyle = '#f3e6cf'; rr(g, x-15, y-26-hop, 30, 22, 9); g.fill();
  g.fillStyle = '#d9503f'; g.beginPath(); g.ellipse(x, y-26-hop, 24, 17, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#fff'; E(g, x-10, y-34-hop, 4.5, 3.5); E(g, x+7, y-38-hop, 4, 3); E(g, x+16, y-29-hop, 3, 2.5);
  g.fillStyle = '#1b2620'; const ex = f.dir * 2; E(g, x-5+ex, y-17-hop, 2.2, 3); E(g, x+5+ex, y-17-hop, 2.2, 3);
  g.fillStyle = '#f3a6a0'; E(g, x-10, y-12-hop, 3, 2); E(g, x+10, y-12-hop, 3, 2);
}
function drawGate(g, t){
  const gx = L.gateX - cam; if (gx < -260 || gx > VW + 80) return;
  const y = GROUND, open = S.gateOpen;
  g.fillStyle = open ? `rgba(255,236,150,${.4 + Math.sin(t/250)*.15})` : 'rgba(0,0,0,.08)'; E(g, gx+45, y-90, 90, 100);
  g.fillStyle = '#b23a32'; g.fillRect(gx-10, y-190, 16, 190); g.fillRect(gx+84, y-190, 16, 190);
  g.fillStyle = '#7d2a24'; g.beginPath(); g.moveTo(gx-34, y-186); g.quadraticCurveTo(gx+45, y-214, gx+124, y-186); g.lineTo(gx+112, y-200); g.quadraticCurveTo(gx+45, y-226, gx-22, y-200); g.closePath(); g.fill();
  g.fillStyle = '#f4c64f'; rr(g, gx+14, y-182, 62, 26, 5); g.fill();
  g.fillStyle = '#7d2a24'; g.font = '700 16px "Do Hyeon", sans-serif'; g.textAlign = 'center'; g.fillText('대나무 언덕', gx+45, y-163);
  if (!open){
    g.fillStyle = '#6b4b2e'; g.fillRect(gx+6, y-150, 78, 150);
    g.fillStyle = '#5a3d24'; for (let k=0;k<4;k++) g.fillRect(gx+6, y-140 + k*36, 78, 3);
    g.fillStyle = '#e3ad1f'; E(g, gx+45, y-80, 10, 10); g.fillRect(gx+42, y-80, 6, 16);
    const left = MISSIONS.filter(m => !S.results[m.id].done).length;
    g.fillStyle = '#fff'; rr(g, gx+12, y-128, 66, 26, 8); g.fill();
    g.fillStyle = '#16392c'; g.font = '15px "Gowun Dodum", sans-serif'; g.fillText(`종 ${left}개 남음`, gx+45, y-110);
  } else {
    g.fillStyle = '#fff2b0'; g.fillRect(gx+6, y-150, 78, 150);
    g.fillStyle = '#ffe27a'; for (let k=0;k<5;k++){ g.globalAlpha = .5; g.fillRect(gx+12 + k*15, y-150, 6, 150); } g.globalAlpha = 1;
  }
  // 그 뒤의 2단계 문 (잠김)
  const sx = L.width - 130 - cam;
  g.fillStyle = '#9aa39b'; rr(g, sx, y-150, 100, 150, 14); g.fill();
  g.fillStyle = '#7b847c'; rr(g, sx+16, y-128, 68, 128, 30); g.fill();
  g.fillStyle = '#fffdf3'; rr(g, sx-8, y-188, 116, 30, 8); g.fill();
  g.fillStyle = '#16392c'; g.font = '700 15px "Do Hyeon", sans-serif'; g.fillText('STAGE 02 🔒', sx+50, y-167);
}
function drawProgress(g, t){
  const x0 = 24, x1 = VW - 24, y = 22, k = (x1 - x0) / L.width;
  g.fillStyle = 'rgba(255,255,255,.75)'; rr(g, x0-10, y-12, x1-x0+20, 24, 12); g.fill();
  g.fillStyle = '#cfdcc9'; rr(g, x0, y-3, x1-x0, 6, 3); g.fill();
  g.fillStyle = '#9ccc6e'; rr(g, x0, y-3, Math.max(6,(P.x - 0)*k), 6, 3); g.fill();
  const blink = (Math.sin(t/(guide.on ? 120 : 260))+1)/2;
  L.bells.forEach(b => { const d = S.results[b.id].done; g.fillStyle = d ? '#e3ad1f' : `rgba(201,86,75,${.5+blink*.5})`; E(g, x0 + b.x*k, y, d ? 6 : 6 + blink*2, d ? 6 : 6 + blink*2); });
  g.fillStyle = S.gateOpen ? '#e3ad1f' : '#b23a32'; g.fillRect(x0 + L.gateX*k - 4, y-7, 8, 14);
  g.fillStyle = '#16392c'; E(g, x0 + (P.x+P.w/2)*k, y, 7, 7); g.fillStyle = '#fff'; E(g, x0 + (P.x+P.w/2)*k, y, 3, 3);
}
function drawGuide(g, t){
  if (!guide.on) return;
  const tg = guideTarget(); if (tg == null) return;
  const dir = Math.sign(tg - (P.x + P.w/2)) || 1;
  const px = P.x + P.w/2 - cam + dir*(48 + Math.sin(t/150)*6), py = P.y - 26;
  g.save(); g.translate(px, py); g.scale(dir,1);
  g.fillStyle = '#e3ad1f'; g.strokeStyle = '#16392c'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(22,0); g.lineTo(-4,-18); g.lineTo(-4,-8); g.lineTo(-20,-8); g.lineTo(-20,8); g.lineTo(-4,8); g.lineTo(-4,18); g.closePath(); g.fill(); g.stroke();
  g.restore();
  const msg = MISSIONS.every(m => S.results[m.id].done) ? '화살표를 따라 언덕 끝의 문으로 가요!' : '화살표 쪽에 아직 울리지 않은 종이 있어요!';
  g.font = '700 18px "Gowun Dodum", sans-serif'; const w = g.measureText(msg).width + 32;
  g.fillStyle = '#fbfdf8'; rr(g, VW/2 - w/2, 46, w, 36, 18); g.fill();
  g.fillStyle = '#16392c'; g.textAlign = 'center'; g.fillText(msg, VW/2, 70);
}
function draw(t){
  cam = Math.max(0, Math.min(L.width - VW, P.x + P.w/2 - VW*.38));
  ctx.setTransform(scale*dpr, 0, 0, scale*dpr, 0, 0);
  ctx.textAlign = 'center';
  drawSky(ctx, t); drawGround(ctx);
  L.platforms.forEach(p => drawPlatform(ctx, p));
  drawGate(ctx, t);
  const near = touching();
  L.bells.forEach(b => drawBell(ctx, b, S.results[b.id].done, t, near === b.id));
  drawBonusBox(ctx, t);
  L.stars.forEach((s,i) => { if (!S.starsTaken.includes(i)) drawStar(ctx, s[0], s[1], t); });
  friends.forEach(f => drawFriend(ctx, f, t));
  drawPanda(ctx, P.x + P.w/2 - cam, P.y + P.h, P.face, Math.abs(P.vx) > 1, !P.onGround, P.joy, P.invuln > 0 && Math.floor(P.invuln*10) % 2 === 0);
  particles = particles.filter(p => t - p.t0 < p.life);
  particles.forEach(p => { const k = (t - p.t0)/p.life; ctx.globalAlpha = 1 - k; ctx.fillStyle = p.c; ctx.font = '700 22px "Do Hyeon", sans-serif';
    if (p.text) ctx.fillText(p.text, p.x - cam, p.y - k*40); else { ctx.strokeStyle = p.c; starShape(ctx, p.x - cam + p.vx*k, p.y + p.vy*k, 7*(1-k*.5)); } });
  ctx.globalAlpha = 1;
  drawGuide(ctx, t);
  drawProgress(ctx, t);
}

/* ================= 움직임과 충돌 ================= */
const keys = { left:false, right:false, jump:false };
function physics(dt){
  const run = D.runSpeed || 240;
  const want = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  P.vx = want * run;
  if (want) P.face = want;
  if (keys.jump){ P.jumpBuf = .14; keys.jump = keys.jumpHeld ? keys.jump : false; }
  P.jumpBuf -= dt; P.coyote -= dt;
  if (P.jumpBuf > 0 && (P.onGround || P.coyote > 0)){ P.vy = -(D.jumpPower || 640); P.onGround = false; P.coyote = 0; P.jumpBuf = 0; Snd.sfx.jump(); }
  P.kx *= Math.pow(.02, dt);
  const prevBottom = P.y + P.h;
  let nx = P.x + (P.vx + P.kx) * dt;
  nx = Math.max(0, Math.min(L.width - P.w - 10, nx));
  if (!S.gateOpen && nx + P.w > L.gateX + 4 && P.x + P.w <= L.gateX + 6) { nx = L.gateX + 4 - P.w; if (!gateWarned){ gateWarned = true; toast(`종 ${MISSIONS.filter(m => !S.results[m.id].done).length}개를 더 울려야 문이 열려요.`); } }
  else if (nx + P.w < L.gateX - 60) gateWarned = false;
  P.x = nx;
  P.vy += 1500 * dt; if (P.vy > 900) P.vy = 900;
  P.y += P.vy * dt;
  const wasGround = P.onGround; P.onGround = false;
  if (P.y + P.h >= GROUND){ P.y = GROUND - P.h; P.vy = 0; P.onGround = true; }
  if (P.vy >= 0) for (const pl of L.platforms){
    if (prevBottom <= pl.y + 4 && P.y + P.h >= pl.y && P.x + P.w > pl.x + 6 && P.x < pl.x + pl.w - 6){ P.y = pl.y - P.h; P.vy = 0; P.onGround = true; }
  }
  if (wasGround && !P.onGround && P.vy >= 0) P.coyote = .1;
  if (Math.abs(P.vx) > 1 && P.onGround) P.phase += dt * 14;
  if (P.invuln > 0) P.invuln -= dt;
  if (P.joy > 0) P.joy = Math.max(0, P.joy - dt);
  // 별
  L.stars.forEach((s,i) => {
    if (S.starsTaken.includes(i)) return;
    if (Math.abs(P.x + P.w/2 - s[0]) < 28 && Math.abs(P.y + P.h/2 - s[1]) < 40){
      S.starsTaken.push(i); S.starPts += D.points.star; Snd.sfx.star();
      particles.push({ x:s[0], y:s[1]-10, t0:performance.now(), life:700, c:'#b98510', text:'+' + D.points.star });
      renderHud(); persist();
    }
  });
  // 숲속 친구
  friends.forEach(f => {
    if (f.stun > 0){ f.stun -= dt; return; }
    f.x += f.dir * (L.friendSpeed || 42) * dt;
    if (f.x < f.from){ f.x = f.from; f.dir = 1; } if (f.x > f.to){ f.x = f.to; f.dir = -1; }
    const fl = f.x - f.w/2, ft = GROUND - f.h;
    if (P.x + P.w - 6 > fl && P.x + 6 < fl + f.w && P.y + P.h > ft + 4 && P.y < GROUND){
      if (P.vy > 0 && prevBottom <= ft + 14){ f.stun = 3; P.vy = -430; Snd.sfx.stomp(); particles.push({ x:f.x, y:ft-10, t0:performance.now(), life:700, c:'#25845f', text:'어지러워~' }); }
      else if (P.invuln <= 0){
        P.invuln = 2; P.kx = (P.x + P.w/2 < f.x ? -1 : 1) * 380; P.vy = -260;
        S.bumps += 1; const before = S.starPts; S.starPts = Math.max(0, S.starPts - D.points.bump);
        Snd.sfx.bump(); renderHud(); persist();
        toast(before > 0 ? `앗, 통통 버섯과 부딪혔어요! 별 -${before - S.starPts}` : '앗, 통통 버섯과 부딪혔어요! 위에서 밟아 보세요.');
      }
    }
  });
}
let gateWarned = false;

/* ================= 종·상자·문 ================= */
function touching(){
  const cx = P.x + P.w/2;
  for (const b of L.bells) if (Math.abs(cx - b.x) < 36 && P.y + P.h > GROUND - 150) return b.id;
  const bx = L.bonusBox; if (Math.abs(cx - bx.x) < 34 && Math.abs((P.y + P.h) - bx.y) < 50) return 'bonus';
  return null;
}
const armed = {};
function checkTriggers(){
  const id = touching();
  ALL.forEach(m => { if (m.id !== id) armed[m.id] = true; });
  if (id && armed[id] !== false && !S.results[id].done){ armed[id] = false; openQuiz(ALL.find(m => m.id === id)); }
  if (S.gateOpen && !S.finished && P.x + P.w/2 > L.gateX + 50) finishGame();
}
const guide = { last:performance.now(), on:false };
function guideTarget(){
  const left = L.bells.filter(b => !S.results[b.id].done);
  if (!left.length) return S.gateOpen ? L.gateX + 45 : null;
  const cx = P.x + P.w/2; return left.reduce((a,b) => Math.abs(b.x - cx) < Math.abs(a.x - cx) ? b : a).x;
}
function updateGuide(now){
  const tg = guideTarget();
  if (quizOpen || S.finished || tg == null || Math.abs(tg - (P.x + P.w/2)) < 150){ guide.last = now; guide.on = false; return; }
  if (now - guide.last > (D.guideAfterSeconds || 15) * 1000) guide.on = true;
}
let toastTimer;
function toast(txt, ms=2300){ const el = $('#toast'); el.textContent = txt; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, ms); }
function checkGate(){
  if (!S.gateOpen && MISSIONS.every(m => S.results[m.id].done)){
    S.gateOpen = true; persist();
    setTimeout(() => { Snd.sfx.door(); toast('종 5개를 모두 울렸어요! 언덕 끝의 문이 열렸어요. 오른쪽으로 달려요!', 3600); guide.on = true; }, 400);
  }
}

/* ================= 퀴즈 ================= */
let quizOpen = false, Q = null;
const shuffle = a => { a = a.slice(); for (let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random()*a.length)];
function openQuiz(m){
  const rec = S.results[m.id];
  Q = { m, rec, locked:false, sel:null };
  if (m.type === 'lockDoor'){ if (!rec.target){ rec.target = pick(TONE_IDS); persist(); } Q.answer = rec.target; }
  else if (m.type === 'sequence'){ if (rec.target == null){ rec.target = Math.floor(Math.random()*m.sets.length); persist(); } Q.set = m.sets[rec.target]; Q.answer = Q.set.sounds.map(s => TONE_OF[s]).join('-'); }
  else Q.answer = m.answer;
  if (m.type === 'pandaChoir' || m.type === 'fragments'){
    Q.opts = shuffle([Q.answer, ...shuffle(TONE_IDS.filter(t => t !== Q.answer)).slice(0, (m.choices || 3) - 1)]);
  }
  quizOpen = true; keys.left = keys.right = keys.jump = false; P.vx = 0;
  document.querySelectorAll('#pad button').forEach(b => b.classList.remove('on'));
  renderQuiz(); $('#quiz').hidden = false;
  Snd.ensure(); Snd.startBgm();
  setTimeout(() => { if (quizOpen && Q && Q.m === m && ['toneButtons','contourCards','lockDoor','sequence'].includes(m.type)) playMain(false); }, 380);
}
function playMain(slow){
  const p = Q.m.type === 'sequence' ? Snd.saySeq(Q.set.sounds, slow) : Snd.say(Q.answer, slow);
  return p.then(updateSrc).catch(showPlayError);
}
function updateSrc(){ const el = $('#srcnote'); if (el) el.innerHTML = sourceBadge(); }
function showPlayError(){ const el = $('#srcnote'); if (el) el.innerHTML = sourceBadge(); const qp = $('#qplay'); if (qp) qp.classList.add('pulse'); }
function renderQuiz(){
  const { m } = Q, box = $('#qbox');
  const n = MISSIONS.indexOf(m);
  let h = `<div class="stars" id="stars"></div>
    <div class="qhead"><span class="place">${m.place}</span><span class="count">${n >= 0 ? `종 ${n+1} / 5` : '보너스'}</span>
    <button class="qclose" id="qclose" type="button" aria-label="닫기">✕</button></div>
    <div class="qtext">${m.question}</div>`;
  const listen = `<div class="listen"><button class="btn play" type="button" id="qplay">▶ 듣기</button>
    <button class="btn" type="button" id="qslow">🐢 천천히</button><button class="btn" type="button" id="qretry">↻ 다시</button></div>
    <div class="srcnote" id="srcnote">${sourceBadge()}</div>`;
  const tone = id => TONE_OF[id];
  switch (m.type){
    case 'toneButtons':
      h += listen + `<div class="choices c4">${TONE_IDS.map(id => `<button class="opt" type="button" data-v="${id}">${contourSVG(tone(id))}<span class="lbl">${tone(id)}성</span><span class="sub">${TONE_DESC[tone(id)]}</span></button>`).join('')}</div>`; break;
    case 'contourCards':
      h += listen + `<div class="choices c4">${shuffle(TONE_IDS).map(id => `<button class="opt" type="button" data-v="${id}" aria-label="높낮이 그림">${contourSVG(tone(id))}</button>`).join('')}</div>`; break;
    case 'pandaChoir':
      h += `<div class="target"><span class="py">${D.audio.sounds[Q.answer].pinyin}</span>${contourSVG(tone(Q.answer))}</div>
        <div class="srcnote" id="srcnote">${sourceBadge() || '판다를 눌러 한 마리씩 소리를 들어 보세요.'}</div>
        <div class="choices c3">${Q.opts.map((id,i) => `<div class="panda-card" id="pc${i}">${pandaFaceSVG()}
          <button class="btn" type="button" data-listen="${id}" data-i="${i}">▶ 들어 보기</button>
          <button class="btn primary" type="button" data-pick="${id}" data-i="${i}" disabled>이 판다!</button></div>`).join('')}</div>`; break;
    case 'fragments':
      h += `<div class="tablet"><span class="py">${D.audio.sounds[Q.answer].pinyin}</span><div class="slot" id="slot">여기에 끼워요</div></div>
        <div class="srcnote" id="srcnote">${sourceBadge() || '대나무 조각을 눌러 소리를 듣고 하나를 골라요.'}</div>
        <div class="choices c3">${Q.opts.map((id,i) => `<button class="tube" type="button" data-tube="${id}"><span class="ring"></span>조각 ${'가나다'[i]}<span class="ring"></span></button>`).join('')}</div>
        <button class="btn primary" type="button" id="insertBtn" disabled>조각 끼우기</button>`; break;
    case 'lockDoor':
      h += listen + `<div class="choices c4">${TONE_IDS.map(id => `<button class="lock" type="button" data-v="${id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span class="py">${D.audio.sounds[id].pinyin}</span></button>`).join('')}</div>`; break;
    case 'sequence':
      h += listen + `<div class="choices c2">${shuffle(m.options).map(o => `<button class="opt" type="button" data-v="${o.join('-')}"><span class="lbl">${o.join(' - ')}</span><span class="seq">${o.map(k => contourSVG(+k, 'mini')).join('')}</span></button>`).join('')}</div>`; break;
  }
  h += `<div class="feedback" id="feedback" aria-live="polite"></div><div id="hintArea"></div>`;
  box.innerHTML = h;
  box.querySelectorAll('svg.mini').forEach(s => { s.style.width = '34px'; s.style.height = '24px'; });
  $('#qclose').onclick = closeQuiz;
  const qp = $('#qplay');
  if (qp){ qp.onclick = () => playMain(false); $('#qslow').onclick = () => playMain(true); $('#qretry').onclick = () => { Snd.retry(); playMain(false); }; }
  box.querySelectorAll('.opt[data-v], .lock[data-v]').forEach(b => b.onclick = () => answer(b.dataset.v, b));
  if (m.type === 'pandaChoir'){
    box.querySelectorAll('[data-listen]').forEach(b => b.onclick = () => {
      const i = b.dataset.i, card = $('#pc'+i);
      card.classList.remove('talk'); void card.offsetWidth; card.classList.add('talk');
      Snd.say(b.dataset.listen).then(updateSrc).catch(showPlayError);
      if (!card.classList.contains('wrong')) box.querySelector(`[data-pick][data-i="${i}"]`).disabled = false;
    });
    box.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => answer(b.dataset.pick, $('#pc'+b.dataset.i)));
  }
  if (m.type === 'fragments'){
    box.querySelectorAll('[data-tube]').forEach(b => b.onclick = () => {
      if (b.classList.contains('wrong') || Q.locked) return;
      Snd.say(b.dataset.tube).then(updateSrc).catch(showPlayError);
      box.querySelectorAll('.tube').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel', 'heard'); Q.sel = b; $('#insertBtn').disabled = false;
    });
    $('#insertBtn').onclick = () => { if (Q.sel) answer(Q.sel.dataset.tube, Q.sel); };
  }
}
function answer(v, el){
  if (!Q || Q.locked || !el || el.classList.contains('wrong')) return;
  Snd.ensure();
  const { m, rec } = Q, correct = String(v) === String(Q.answer);
  rec.tries += 1;
  if (rec.first === null){ rec.first = v; rec.firstCorrect = correct; }
  if (!correct) rec.wrongs.push(v);
  persist();
  if (correct){
    Q.locked = true; el.classList.add('right');
    const isBonus = m.id === 'bonus';
    const pts = rec.tries === 1 ? (isBonus ? D.points.bonusFirstTry : D.points.firstTry) : (isBonus ? D.points.bonusRetry : D.points.retry);
    if (!rec.done){
      rec.points = pts; rec.done = true; rec.doneAt = Date.now(); S.learn += pts;
      if (m.reward && !S.items.includes(m.reward)) S.items.push(m.reward);
      persist();
    }
    if (m.type === 'fragments'){ const sl = $('#slot'); sl.classList.add('filled'); sl.textContent = '딱 맞아요!'; }
    Snd.sfx.correct(); setTimeout(isBonus ? Snd.sfx.bonus : Snd.sfx.bell, 300);
    const fb = $('#feedback'); fb.className = 'feedback good'; fb.textContent = `정답! 학습 점수 +${pts}`;
    burst(pts);
    setTimeout(() => {
      closeQuiz(); P.joy = 1.2;
      for (let i=0;i<14;i++) particles.push({ x:P.x + P.w/2, y:P.y + 10, vx:(Math.random()-.5)*120, vy:-(Math.random()*90 + 20), t0:performance.now(), life:900, c: i%2 ? '#e3ad1f' : '#fff6c9' });
      toast(`${m.reward} 획득!`); renderHud(); checkGate();
    }, 1500);
  } else {
    el.classList.add('wrong');
    if (m.type === 'pandaChoir'){ const pb = el.querySelector('[data-pick]'); if (pb) pb.disabled = true; }
    if (m.type === 'fragments'){ Q.sel = null; $('#insertBtn').disabled = true; }
    Snd.sfx.wrong();
    const fb = $('#feedback'); fb.className = 'feedback bad'; fb.textContent = '아깝다! 힌트를 보고 다시 해 봐요.';
    let hint = `<div class="hint"><span>💡</span><div><b>힌트</b> ${m.hint}`;
    if (m.type === 'lockDoor' || m.type === 'sequence') hint += `<div class="contour-ref" style="margin-top:8px">${[1,2,3,4].map(k => `<div>${contourSVG(k)}${k}성</div>`).join('')}</div>`;
    $('#hintArea').innerHTML = hint + '</div></div>';
  }
}
function burst(pts){
  const st = $('#stars'); if (!st) return;
  for (let i=0;i<18;i++){ const s = document.createElement('i'), a = Math.random()*Math.PI*2, r = 90 + Math.random()*120;
    s.style.left = '50%'; s.style.top = '45%'; s.style.setProperty('--dx', Math.cos(a)*r + 'px'); s.style.setProperty('--dy', Math.sin(a)*r + 'px'); st.appendChild(s); }
  const p = document.createElement('div'); p.className = 'plus'; p.textContent = '+' + pts; st.appendChild(p);
}
function closeQuiz(){
  if (Q && !Q.rec.done) toast('종 앞으로 다시 오면 문제를 이어서 풀 수 있어요.');
  $('#quiz').hidden = true; quizOpen = false; Q = null; guide.last = performance.now();
}
$('#quiz').addEventListener('click', e => { if (e.target.id === 'quiz') closeQuiz(); });

/* ================= 화면 위 점수판 ================= */
function renderHud(){
  $('#learnScore').textContent = S.learn;
  $('#starScore').textContent = S.starPts;
  $('#bells').innerHTML = MISSIONS.map(m => bellSVG(S.results[m.id].done)).join('');
  const all = [...MISSIONS.map(m => m.reward), D.bonus.reward];
  $('#items').innerHTML = all.map(r => `<span class="item ${S.items.includes(r) ? 'got' : ''}">${r.replace(' 조각','')}</span>`).join('');
  $('#who').textContent = `${S.name} #${S.tag}`;
}

/* ================= 조작 ================= */
const KEYS = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'jump', KeyW:'jump', Space:'jump' };
const canControl = () => !$('#play').hidden && !quizOpen && $('#soundPanel').hidden && $('#helpPanel').hidden && !S.finished;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ if (quizOpen) closeQuiz(); $('#soundPanel').hidden = true; $('#helpPanel').hidden = true; return; }
  const k = KEYS[e.code]; if (!k || !canControl()) return;
  e.preventDefault(); Snd.ensure(); Snd.startBgm();
  if (k === 'jump'){ if (!e.repeat) keys.jump = true; } else keys[k] = true;
});
document.addEventListener('keyup', e => { const k = KEYS[e.code]; if (k && k !== 'jump') keys[k] = false; });
window.addEventListener('blur', () => { keys.left = keys.right = keys.jump = false; });
document.querySelectorAll('#pad button').forEach(b => {
  const k = b.dataset.key;
  b.addEventListener('pointerdown', e => {
    e.preventDefault(); if (!canControl()) return; Snd.ensure(); Snd.startBgm();
    b.classList.add('on'); if (k === 'jump') keys.jump = true; else keys[k] = true;
    try { b.setPointerCapture(e.pointerId); } catch(_){}
  });
  const off = () => { b.classList.remove('on'); if (k !== 'jump') keys[k] = false; };
  b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
let touchSeen = window.matchMedia('(pointer: coarse)').matches;
window.addEventListener('touchstart', () => { touchSeen = true; if (!$('#play').hidden) $('#pad').hidden = false; }, { passive:true });

/* ================= 화면 흐름 ================= */
function show(id){ ['#startScreen','#storyScreen','#play','#endScreen'].forEach(s => $(s).hidden = s !== id); }
function cleanName(v){ return v.replace(/[<>"'&]/g, '').trim().slice(0, 12); }
function initStart(){
  $('#stageLabel').textContent = `중국어 탐험대 · ${D.stageLabel}`;
  $('#gameTitle').innerHTML = `${D.title}<small>${D.subtitle}</small>`;
  const saved = store.load();
  if (saved && saved.name && saved.results){
    $('#resumeBox').hidden = false; $('#newBox').hidden = true;
    $('#resumeBtn').textContent = `이어서 하기 (${saved.name} #${saved.tag})`;
  }
  $('#resumeBtn').onclick = () => { Snd.ensure(); Snd.startBgm(); S = saved; ALL.forEach(m => { if (!S.results[m.id]) S.results[m.id] = emptyRec(); }); if (S.finished) finishGame(); else enterPlay(); };
  $('#newBtn').onclick = () => { $('#resumeBox').hidden = true; $('#newBox').hidden = false; $('#nameInput').focus(); };
  $('#testBtn').onclick = () => {
    Snd.ensure(); $('#testResult').textContent = '재생 중…';
    Snd.say('ma1').then(() => $('#testResult').innerHTML = '들리나요? ' + sourceBadge()).catch(() => $('#testResult').innerHTML = sourceBadge());
  };
  $('#startBtn').onclick = startNew;
  $('#nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') startNew(); });
}
function startNew(){
  const name = cleanName($('#nameInput').value);
  if (!name){ $('#nameInput').focus(); $('#nameInput').placeholder = '이름을 먼저 써 주세요!'; return; }
  Snd.ensure(); Snd.startBgm();
  S = newState(name); persist();
  storyStep = 0; show('#storyScreen'); renderStory();
}
let storyStep = 0;
function renderStory(){
  $('#storyText').textContent = D.story[storyStep];
  $('#storyDots').innerHTML = D.story.map((_,i) => `<b class="${i === storyStep ? 'on' : ''}"></b>`).join('');
  $('#nextBtn').textContent = storyStep === D.story.length - 1 ? '모험 출발!' : '다음';
  const g = $('#storyCanvas').getContext('2d');
  g.setTransform(2,0,0,2,0,0); g.clearRect(0,0,220,150);
  const sky = g.createLinearGradient(0,0,0,150); sky.addColorStop(0,'#8fd3e6'); sky.addColorStop(1,'#e8f6d8');
  g.fillStyle = sky; rr(g,0,0,220,150,18); g.fill();
  g.fillStyle = '#6aa857'; g.fillRect(0,118,220,32);
  for (let i=0;i<5;i++){ g.fillStyle = '#86b886'; g.fillRect(14 + i*46, 30, 7, 88); g.fillStyle = '#79ad78'; E(g, 8 + i*46, 40, 12, 4, -.5); }
  if (storyStep === 1){ g.fillStyle = '#b23a32'; g.fillRect(150,52,8,66); g.fillRect(192,52,8,66); g.fillStyle = '#6b4b2e'; g.fillRect(158,62,34,56); g.fillStyle = '#e3ad1f'; E(g,175,90,5,5);
    g.fillStyle = '#16392c'; g.font = '700 22px sans-serif'; g.fillText('?', 120, 50); g.fillText('?', 205, 40); }
  if (storyStep === 2){ [[150,60],[178,46],[204,62]].forEach(([x,y]) => { g.fillStyle = '#e3ad1f'; g.beginPath(); g.moveTo(x-8,y+8); g.quadraticCurveTo(x-9,y-8,x,y-10); g.quadraticCurveTo(x+9,y-8,x+8,y+8); g.fill(); }); }
  const keep = P.phase; P.phase = 0;
  drawPanda(g, 80, 120, 1, false, false, storyStep === 2 ? .5 : 0, false); P.phase = keep;
}
$('#nextBtn').onclick = () => { Snd.sfx.blip(); if (storyStep < D.story.length - 1){ storyStep++; renderStory(); } else enterPlay(); };
$('#skipBtn').onclick = enterPlay;
function enterPlay(){
  show('#play');
  $('#pad').hidden = !touchSeen;
  P.x = Math.max(0, Math.min(L.width - 200, S.x || L.start)); P.y = GROUND - P.h; P.vx = P.vy = P.kx = 0; P.onGround = true;
  if (!S.gateOpen && P.x + P.w > L.gateX) P.x = L.gateX - 80;
  guide.last = performance.now(); guide.on = !!S.gateOpen && !S.finished;
  ALL.forEach(m => armed[m.id] = true);
  requestAnimationFrame(() => { resize(); });
  resize(); renderHud();
  const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 700;
  toast(portrait ? '휴대폰을 가로로 돌리면 더 크게 보여요! 📱' : '오른쪽으로 달려 빛나는 소리의 종을 찾아요! 🔔', 2800);
}
function finishGame(){
  if (!S.finished){ S.finished = true; S.finishedAt = Date.now(); persist(); }
  keys.left = keys.right = keys.jump = false;
  Snd.sfx.fanfare(); show('#endScreen');
  const first = MISSIONS.filter(m => S.results[m.id].firstCorrect === true).length;
  $('#endLearn').textContent = S.learn; $('#endStar').textContent = S.starPts; $('#endTotal').textContent = S.learn + S.starPts;
  $('#endName').textContent = `${S.name} #${S.tag}`;
  $('#endFirst').textContent = `처음에 맞힌 문제 ${first} / ${MISSIONS.length}`;
  $('#endBonus').textContent = S.results.bonus.done ? '획득!' : '찾지 못함';
  $('#nextName').textContent = D.nextStage; $('#nextLine').textContent = D.nextStageLine;
  $('#saveStatus').innerHTML = '💾 결과가 이 기기에 저장되었어요. <span class="note">(시범판: 선생님 화면 연결은 다음 단계에서 추가됩니다)</span>';
  setTimeout(() => Snd.say('nihao').catch(() => {}), 1300);
}
$('#nihaoBtn').onclick = () => Snd.say('nihao').catch(() => {});
$('#replayBtn').onclick = () => { show('#play'); P.x = L.gateX - 200; P.y = GROUND - P.h; resize(); renderHud(); toast('남은 별을 모으며 자유롭게 달려 보세요!'); };

/* 설정·도움말 */
function syncSliders(){
  ['bgm','sfx','voice'].forEach(k => { const id = 'vol' + k[0].toUpperCase() + k.slice(1); $('#'+id).value = prefs[k]; $('#'+id+'V').textContent = prefs[k]; });
  $('#muteAll').checked = prefs.mute;
  const src = SOURCE_TEXT[Snd.source()];
  $('#voiceSourceNote').textContent = '중국어 소리: ' + (src ? src[0] : '아직 재생 전');
  $('#renameInput').value = S ? S.name : ''; $('#renameMsg').textContent = '';
}
['bgm','sfx','voice'].forEach(k => { const id = 'vol' + k[0].toUpperCase() + k.slice(1);
  $('#'+id).addEventListener('input', e => { prefs[k] = +e.target.value; $('#'+id+'V').textContent = prefs[k]; Snd.apply(); savePrefs(); }); });
$('#muteAll').addEventListener('change', e => { prefs.mute = e.target.checked; Snd.apply(); savePrefs(); });
$('#soundBtn').onclick = () => { keys.left = keys.right = false; syncSliders(); $('#soundPanel').hidden = false; };
$('#soundClose').onclick = () => $('#soundPanel').hidden = true;
$('#renameBtn').onclick = () => { const n = cleanName($('#renameInput').value); if (!n){ $('#renameMsg').textContent = '이름을 써 주세요.'; return; } S.name = n; persist(); renderHud(); $('#renameMsg').textContent = '저장했어요.'; };
$('#helpBtn').onclick = () => { keys.left = keys.right = false; $('#helpContours').innerHTML = [1,2,3,4].map(n => `<div>${contourSVG(n)}${n}성 ${TONE_DESC[n]}</div>`).join(''); $('#helpPanel').hidden = false; };
$('#helpClose').onclick = () => $('#helpPanel').hidden = true;
window.addEventListener('resize', resize);

/* ================= 메인 루프 =================
   GPT 버전이 멈춘 원인: 게임 시작 전에 그리기를 시작해 없는 자료를 읽다가 오류가 났어요.
   여기서는 학생이 게임을 시작한 뒤(S가 준비된 뒤)에만 그립니다. */
let lastT = performance.now(), posSave = 0;
function loop(now){
  const dt = Math.min(.033, (now - lastT)/1000); lastT = now;
  try {
    if (S && !$('#play').hidden){
      if (canControl()){ physics(dt); checkTriggers(); } else { P.vx = 0; }
      updateGuide(now);
      draw(now);
      if (now - posSave > 3000){ posSave = now; S.x = P.x; persist(); }
    }
  } catch(err){ console.error(err); }
  requestAnimationFrame(loop);
}
initStart();
requestAnimationFrame(loop);
})();
