type ScreenId = "login"|"loading"|"captcha"|"final-loading"|"error";

const screens: Record<ScreenId, HTMLElement> = {
  login: document.getElementById("login-screen") as HTMLElement,
  loading: document.getElementById("loading-screen") as HTMLElement,
  captcha: document.getElementById("captcha-screen") as HTMLElement,
  "final-loading": document.getElementById("final-loading-screen") as HTMLElement,
  error: document.getElementById("error-screen") as HTMLElement
};

function show(screen: ScreenId){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[screen].classList.add("active");
}

/* --- Login flow --- */
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
loginBtn.addEventListener("click", () => {
  // accept any data
  show("loading");
  setTimeout(() => startCaptchaFlow(), 1400);
});

/* --- Captcha flow control --- */
const canvas = document.getElementById("captcha-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const titleEl = document.getElementById("captcha-title") as HTMLElement;
const controlsEl = document.getElementById("captcha-controls") as HTMLElement;
const hintEl = document.getElementById("captcha-hint") as HTMLElement;

let captchaIndex = 0;
const totalCaptchas = 5;

function startCaptchaFlow(){
  captchaIndex = 0;
  show("captcha");
  nextCaptcha();
}

function nextCaptcha(){
  controlsEl.innerHTML = "";
  hintEl.textContent = "";
  ctx.clearRect(0,0,canvas.width,canvas.height);
  captchaIndex++;
  if(captchaIndex>totalCaptchas){
    // final
    show("final-loading");
    setTimeout(()=> show("error"), 1600);
    return;
  }
  switch(captchaIndex){
    case 1: runCaptcha1(); break;
    case 2: runCaptcha2(); break;
    case 3: runCaptcha3(); break;
    case 4: runCaptcha4(); break;
    case 5: runCaptcha5(); break;
  }
}

/* Utility: random */
function rnd(min:number, max:number){ return Math.random()*(max-min)+min; }

/* --- CAPTCHA 1: choose the circle (simple shapes) --- */
function runCaptcha1(){
  titleEl.textContent = "Captcha 1 — Haz clic en el círculo";
  // draw 3 shapes: circle, square, triangle
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const shapes: any[] = [];
  // circle
  const cx = 140, cy=180, r=60;
  shapes.push({type:"circle", x:cx, y:cy, r});
  // square
  shapes.push({type:"rect", x: 300, y:130, w:120, h:120});
  // triangle
  shapes.push({type:"tri", x1:520,y1:220,x2:470,y2:120,x3:570,y3:120});
  // render
  shapes.forEach((s, idx)=>{
    ctx.fillStyle = idx===0 ? "#3fb4ff" : (idx===1 ? "#9dd3ff" : "#7ec8ff");
    ctx.beginPath();
    if(s.type==="circle"){ ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill() }
    else if(s.type==="rect"){ ctx.fillRect(s.x,s.y,s.w,s.h) }
    else { ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.lineTo(s.x3,s.y3); ctx.closePath(); ctx.fill() }
    // add outline
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth=3; ctx.stroke();
  });

  // click handler: detect whether clicked the circle (shapes[0])
  function handler(e:MouseEvent){
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const c = shapes[0];
    const dx = x-c.x, dy = y-c.y;
    const clickedCircle = dx*dx+dy*dy <= c.r*c.r;
    if(clickedCircle){
      canvas.removeEventListener("click", handler);
      showTemporaryMessage("Correcto! avanzando...", ()=> nextCaptcha());
    } else {
      // feedback: shake
      flashRed();
    }
  }
  canvas.addEventListener("click", handler);
}

/* --- CAPTCHA 2: shapes with noise / distortion --- */
function runCaptcha2(){
  titleEl.textContent = "Captcha 2 — Encuentra el triángulo";
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // generate three shapes with overlays of noise
  const shapes = [
    {type:"rect", x:80,y:100,w:140,h:120},
    {type:"circle", x:330,y:170,r:70},
    {type:"tri", pts:[{x:520,y:240},{x:480,y:120},{x:560,y:120}]}
  ];
  // draw shapes with slight rotation/wobble
  shapes.forEach((s, i)=>{
    ctx.save();
    ctx.globalAlpha = 0.95;
    if(s.type==="rect"){ ctx.beginPath(); roundRect(ctx, s.x!, s.y!, s.w!, s.h!, 12); ctx.fillStyle="#66c7ff"; ctx.fill(); }
    if(s.type==="circle"){ ctx.beginPath(); ctx.arc(s.x!, s.y!, s.r!, 0, Math.PI * 2);; ctx.fillStyle="#9fe7ff"; ctx.fill(); }
    if(s.type==="tri"){ ctx.beginPath(); ctx.moveTo(s.pts[0].x,s.pts[0].y); ctx.lineTo(s.pts[1].x,s.pts[1].y); ctx.lineTo(s.pts[2].x,s.pts[2].y); ctx.closePath(); ctx.fillStyle="#4fb0ff"; ctx.fill(); }
    ctx.restore();
  });

  addNoise(0.6);

  function handler(e:MouseEvent){
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const tri = shapes[2].pts;
    if(pointInTriangle({x,y}, tri[0],tri[1],tri[2])){
      canvas.removeEventListener("click", handler);
      showTemporaryMessage("Correcto! avanzando...", ()=> nextCaptcha());
    } else { flashRed(); }
  }
  canvas.addEventListener("click", handler);
}

function runCaptcha3(){
  titleEl.textContent = "Captcha 3 — Selecciona en orden: círculo → cuadrado → diamante";
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const targets = [
    {id:"circle", x:120,y:160,r:50},
    {id:"square", x:300,y:120,w:110,h:110},
    {id:"diamond", x:520,y:160, w:100,h:100}
  ];
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawTargets();

  let step = 0;
  function handler(e:MouseEvent){
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const current = targets[step];
    let ok=false;
    if(current.id==="circle"){ const dx=x-current.x, dy=y-current.y; ok = dx*dx+dy*dy <= current.r*current.r; }
    else if(current.id==="square"){ ok = x>=current.x && x<=current.x+current.w && y>=current.y && y<=current.y+current.h; }
    else {
      const poly = [{x:current.x, y:current.y-current.h/2},{x:current.x+current.w/2,y:current.y},{x:current.x,y:current.y+current.h/2},{x:current.x-current.w/2,y:current.y}];
      ok = pointInPolygon({x,y}, poly);
    }
    if(ok){
      markSelected(current);
      step++;
      if(step>=targets.length){
        canvas.removeEventListener("click", handler);
        setTimeout(()=> nextCaptcha(), 700);
      } else {
        hintEl.textContent = `Paso ${step+1} de ${targets.length}`;
      }
    } else {
      flashRed();
    }
  }
  canvas.addEventListener("click", handler);

  function drawTargets(){
    ctx.fillStyle="#5bd0ff"; ctx.beginPath(); ctx.arc(targets[0].x, targets[0].y, targets[0].r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#85e0ff"; ctx.fillRect(targets[1].x, targets[1].y, targets[1].w, targets[1].h);
    ctx.save();
    ctx.translate(targets[2].x, targets[2].y);
    ctx.rotate(Math.PI/4);
    ctx.fillStyle="#3fb4ff";
    ctx.fillRect(-targets[2].w/2, -targets[2].h/2, targets[2].w, targets[2].h);
    ctx.restore();
  }
  function markSelected(t:any){
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#fff";
    if(t.id==="circle"){ ctx.beginPath(); ctx.arc(t.x,t.y,t.r+6,0,Math.PI*2); ctx.fill(); }
    else if(t.id==="square"){ ctx.fillRect(t.x-6, t.y-6, t.w+12, t.h+12); }
    else { ctx.translate(t.x,t.y); ctx.rotate(Math.PI/4); ctx.fillRect(-t.w/2-6,-t.h/2-6,t.w+12,t.h+12); }
    ctx.restore();
  }
}

/* --- CAPTCHA 4: text input (legible) --- */
function runCaptcha4(){
  titleEl.textContent = "Captcha 4 — Escribe el texto que ves";
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const code = randomText(5);
  ctx.font = "48px monospace";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#133a63";
  ctx.fillText(code, 80, 180);
  controlsEl.innerHTML = `<input id="captcha4-input" placeholder="Escribe aquí" /> <button id="captcha4-ok">Verificar</button>`;
  const input = document.getElementById("captcha4-input") as HTMLInputElement;
  const okBtn = document.getElementById("captcha4-ok") as HTMLButtonElement;
  okBtn.addEventListener("click", ()=>{
    if(input.value.trim().toLowerCase() === code.toLowerCase()){
      showTemporaryMessage("Correcto! avanzando...", ()=> nextCaptcha());
    } else { flashRed(); }
  });
}

/* --- CAPTCHA 5: text ilegible (ruido + distorsión) --- */
function runCaptcha5(){
  titleEl.textContent = "Captcha 5 — Escribe el texto en orden correcto";
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const code = randomText(6);
  const baseX = 40;
  for(let i=0;i<code.length;i++){
    const ch = code[i];
    const fontSize = rnd(28,50);
    ctx.save();
    const x = baseX + i*80 + rnd(-8,12);
    const y = 120 + Math.sin(i)*40 + rnd(-6,16);
    ctx.translate(x,y);
    const angle = rnd(-0.6,0.6);
    ctx.rotate(angle);
    ctx.font = `${fontSize}px Georgia`;
    ctx.fillStyle = `rgba(10,40,80,${rnd(0.6,0.95)})`;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }
  addNoise(0.18);
  for(let i=0;i<5;i++){
    ctx.beginPath();
    ctx.moveTo(0, 30 + i*60);
    for(let x=0;x<canvas.width;x+=10) ctx.lineTo(x, 30 + i*60 + Math.sin(x/30 + i)*12);
    ctx.strokeStyle = `rgba(10,30,60,${0.12 + i*0.02})`; ctx.lineWidth=2; ctx.stroke();
  }
  controlsEl.innerHTML = `<input id="captcha5-input" placeholder="Escribe el texto (sensible a mayúsculas)"/> <button id="captcha5-ok">Verificar</button>`;
  const input = document.getElementById("captcha5-input") as HTMLInputElement;
  const okBtn = document.getElementById("captcha5-ok") as HTMLButtonElement;
  okBtn.addEventListener("click", ()=>{
    if(input.value.trim() === code){
      showTemporaryMessage("Correcto! finalizando...", ()=> nextCaptcha());
    } else {
      flashRed();
    }
  });
}

/* --- Helpers --- */

function showTemporaryMessage(msg:string, cb?:()=>void){
  hintEl.textContent = msg;
  setTimeout(()=>{ hintEl.textContent=""; if(cb) cb(); }, 900);
}

function flashRed(){
  canvas.style.transition = "transform 0.06s";
  canvas.style.transform = "translateX(-6px)";
  setTimeout(()=>{ canvas.style.transform = "translateX(6px)"; setTimeout(()=> canvas.style.transform = "translateX(0)",80); },60);
  // small red flash overlay:
  const old = ctx.getImageData(0,0,canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,0,0,0.08)"; ctx.fillRect(0,0,canvas.width,canvas.height);
  setTimeout(()=> ctx.putImageData(old,0,0), 160);
}

function randomText(n:number){
  const abc = "ABCDEFGHJKLMNPQRTUVWXYZ23456789";
  let s="";
  for(let i=0;i<n;i++) s+=abc.charAt(Math.floor(Math.random()*abc.length));
  return s;
}

function addNoise(alpha=0.08){
  const w = canvas.width, h = canvas.height;
  const img = ctx.getImageData(0,0,w,h);
  for(let i=0;i<img.data.length;i+=4){
    const v = (Math.random()-0.5)*255*alpha;
    img.data[i] = clamp(img.data[i]+v,0,255);
    img.data[i+1] = clamp(img.data[i+1]+v,0,255);
    img.data[i+2] = clamp(img.data[i+2]+v,0,255);
  }
  ctx.putImageData(img,0,0);
  // sprinkle random lines
  for(let i=0;i<18;i++){
    ctx.beginPath();
    ctx.moveTo(rnd(0,w), rnd(0,h));
    ctx.lineTo(rnd(0,w), rnd(0,h));
    ctx.strokeStyle = `rgba(20,40,80,${0.06+rnd(0,0.12)})`;
    ctx.lineWidth = 1+Math.random()*2;
    ctx.stroke();
  }
}

function clamp(v:number, a:number, b:number){ return Math.max(a, Math.min(b, v)); }

function pointInTriangle(p:{x:number,y:number}, a:{x:number,y:number}, b:{x:number,y:number}, c:{x:number,y:number}){
  // barycentric
  const area = 0.5 *(-b.y*c.x + a.y*(-b.x + c.x)+a.x*(b.y - c.y)+b.x*c.y);
  const s = 1/(2*area)*(a.y*c.x - a.x*c.y + (c.y - a.y)*p.x + (a.x - c.x)*p.y);
  const t = 1/(2*area)*(a.x*b.y - a.y*b.x + (a.y - b.y)*p.x + (b.x - a.x)*p.y);
  return s>0 && t>0 && (s+t)<1;
}

function pointInPolygon(p:{x:number,y:number}, poly:{x:number,y:number}[]){
  // ray casting
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i].x, yi=poly[i].y, xj=poly[j].x, yj=poly[j].y;
    const intersect = ((yi>p.y)!==(yj>p.y)) && (p.x < (xj-xi)*(p.y-yi)/(yj-yi)+xi);
    if(intersect) inside = !inside;
  }
  return inside;
}

function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

/* --- init: show login --- */
show("login");
