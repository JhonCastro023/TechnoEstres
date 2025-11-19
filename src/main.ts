// src/main.ts
// Flujo completo TechnoEstrés — TypeScript (strict-friendly)

type ScreenId =
  | "landing-screen" | "signup-screen" | "progress-screen"
  | "captcha1-screen" | "retry-btn-screen" | "captcha2-screen"
  | "captcha3-screen" | "captcha4-screen" | "captcha5-screen"
  | "error1-screen" | "error2-screen" | "fatal-error-screen"
  | "saved-screen" | "qa-screen" | "thankyou-screen";

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemento no encontrado: ${id}`);
  return el;
}

// Reemplaza tu función show por esta:
function show(screenId: ScreenId) {
  // ocultar todas
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  // mostrar la solicitada
  const el = document.getElementById(screenId);
  if (!el) throw new Error(`No existe pantalla: ${screenId}`);
  el.classList.add("active");

  // al mostrar cada pantalla, inicializa su captcha si aplica
  if (screenId === "captcha1-screen") {
    initCaptcha1();
  }
  if (screenId === "captcha2-screen") {
    initCaptcha2();
  }
  if (screenId === "captcha3-screen") {
    initCaptcha3();
  }
  if (screenId === "captcha4-screen") {
    initCaptcha4();
  }
  if (screenId === "captcha5-screen") {
    initCaptcha5();
  }
}



/* -------------------------
   Flow control: sequence
   ------------------------- */

const flowSequence: ScreenId[] = [
  "landing-screen", "signup-screen",
  // progress and captcha steps will be called programmatically
];

// Start: landing -> signup
document.getElementById("go-to-signup")?.addEventListener("click", () => {
  show("signup-screen");
});

// Signup button: start progress 1
document.getElementById("signup-btn")?.addEventListener("click", () => {
  startProgress({
    initialMsg: "Un momento, estamos creando tu cuenta...",
    switchAtPercent: 80,
    switchMsg: "Estamos teniendo problemas técnicos, estamos en proceso de solucionarlos...",
    onComplete: () => show("captcha1-screen")
  });
});

/* -------------------------
   Generic progress bar util
   ------------------------- */

interface ProgressOptions {
  initialMsg: string;
  switchAtPercent?: number;
  switchMsg?: string;
  onComplete?: () => void;
  speedMs?: number; // ms per percent
}

function startProgress(opts: ProgressOptions) {
  const fill = $("progress-fill");
  const msg = $("progress-msg");
  const speed = opts.speedMs ?? 30;
  let p = 0;
  msg.textContent = opts.initialMsg;
  show("progress-screen");
  fill.style.width = "0%";

  const iv = setInterval(() => {
    p++;
    fill.style.width = `${p}%`;
    if (opts.switchAtPercent && p === opts.switchAtPercent && opts.switchMsg) {
      msg.textContent = opts.switchMsg;
    }
    if (p >= 100) {
      clearInterval(iv);
      setTimeout(() => { if (opts.onComplete) opts.onComplete(); }, 600);
    }
  }, speed);
}

/* -------------------------
   CAPTCHA 1: click circle
   ------------------------- */

function initCaptcha1() {
  const canvas = document.getElementById("captcha-canvas") as HTMLCanvasElement | null;
  const hint = document.getElementById("captcha-hint");
  if (!canvas) {
    console.error("initCaptcha1: canvas no encontrado (id='captcha-canvas').");
    return;
  }
  if (!hint) {
    console.warn("initCaptcha1: hint no encontrado");
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("initCaptcha1: no se pudo obtener contexto 2D");
    return;
  }

  // Limpia cualquier listener previo (evita múltiples manejadores si se entra varias veces)
  const newCanvas = canvas.cloneNode(true) as HTMLCanvasElement;
  canvas.parentNode!.replaceChild(newCanvas, canvas);

  const c = newCanvas;
  const ctx2 = c.getContext("2d")!;
  ctx2.clearRect(0, 0, c.width, c.height);

  // Dibuja las formas
  const circle = { x: 150, y: 180, r: 60 };
  const rect = { x: 330, y: 140, w: 120, h: 120 };
  const tri = { pts: [{ x: 550, y: 240 }, { x: 500, y: 120 }, { x: 600, y: 120 }] };

  // circle
  ctx2.fillStyle = "#3fb4ff"; ctx2.beginPath(); ctx2.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2); ctx2.fill();
  ctx2.strokeStyle = "rgba(255,255,255,0.7)"; ctx2.lineWidth = 3; ctx2.stroke();
  // rect
  ctx2.fillStyle = "#9dd3ff"; ctx2.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx2.strokeStyle = "rgba(255,255,255,0.6)"; ctx2.strokeRect(rect.x, rect.y, rect.w, rect.h);
  // triangle
  ctx2.fillStyle = "#7ec8ff"; ctx2.beginPath(); ctx2.moveTo(tri.pts[0].x, tri.pts[0].y); ctx2.lineTo(tri.pts[1].x, tri.pts[1].y); ctx2.lineTo(tri.pts[2].x, tri.pts[2].y); ctx2.closePath(); ctx2.fill(); ctx2.stroke();

  // handler único que detecta click/tap
  function handler(ev: MouseEvent | TouchEvent) {
    let clientX: number, clientY: number;
    if (ev instanceof TouchEvent) {
      clientX = ev.touches[0].clientX; clientY = ev.touches[0].clientY;
    } else {
      clientX = (ev as MouseEvent).clientX; clientY = (ev as MouseEvent).clientY;
    }
    const rectBox = c.getBoundingClientRect();
    const x = clientX - rectBox.left;
    const y = clientY - rectBox.top;
    const dx = x - circle.x, dy = y - circle.y;

    if (dx * dx + dy * dy <= circle.r * circle.r) {
      // correcto
      c.removeEventListener("click", handler as EventListener);
      c.removeEventListener("touchstart", handler as EventListener);
      if (hint) hint.textContent = "Correcto! avanzando...";
      // pequeña pausa y mostrar progreso de éxito
      setTimeout(() => {
        startProgress({
          initialMsg: "¡Excelente! Primer paso completado.",
          onComplete: () => show("retry-btn-screen"),
          speedMs: 20
        });
      }, 600);
    } else {
      // retroalimentación visual
      flashCanvas(c);
      if (hint) hint.textContent = "Intenta de nuevo";
      // borra mensaje después
      setTimeout(() => { if (hint) hint.textContent = ""; }, 900);
    }
  }

  // attach handlers
  c.addEventListener("click", handler as EventListener);
  c.addEventListener("touchstart", handler as EventListener);
}


/* -------------------------
   Captcha 2: triangle with noise
   ------------------------- */

function initCaptcha2() {
  const canvas = document.getElementById("captcha2-canvas") as HTMLCanvasElement | null;
  const hint = document.getElementById("captcha2-hint");
  if (!canvas || !hint) return;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const shapes = [
    {type: "rect", x:80,y:100,w:140,h:120},
    {type: "circle", x:330,y:170,r:70},
    {type: "tri", pts:[{x:520,y:240},{x:480,y:120},{x:560,y:120}]}
  ];

  shapes.forEach(s => {
    ctx.save();
    if (s.type === "rect") { ctx.fillStyle="#66c7ff"; roundRect(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill(); }
    else if (s.type === "circle") { ctx.fillStyle="#9fe7ff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r,0,Math.PI*2); ctx.fill(); }
    else { ctx.fillStyle="#4fb0ff"; ctx.beginPath(); ctx.moveTo(s.pts![0].x,s.pts![0].y); ctx.lineTo(s.pts![1].x,s.pts![1].y); ctx.lineTo(s.pts![2].x,s.pts![2].y); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  });

  addNoiseToCanvas(ctx, canvas, 0.06);

  function handler(ev: MouseEvent) {
    const rectBox = canvas.getBoundingClientRect();
    const x = ev.clientX - rectBox.left, y = ev.clientY - rectBox.top;
    const tri = shapes[2].pts!;
    if (pointInTriangle({x,y}, tri[0], tri[1], tri[2])) {
      canvas.removeEventListener("click", handler);
      hint!.textContent = "Correcto!";
      setTimeout(()=> {
        startProgress({
          initialMsg: "¡Casi lo logras! Inténtalo otra vez.",
          onComplete: () => show("captcha3-screen"),
          speedMs: 20
        });
      }, 500);
    } else {
      flashCanvas(canvas);
    }
  }

  canvas.addEventListener("click", handler);
}

/* -------------------------
   Captcha 3: multiple steps
   ------------------------- */

function initCaptcha3() {
  const canvas = document.getElementById("captcha3-canvas") as HTMLCanvasElement | null;
  const hint = document.getElementById("captcha3-hint");
  if (!canvas || !hint) return;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const targets = [
    {id:"circle", x:120,y:160,r:50},
    {id:"square", x:300,y:120,w:110,h:110},
    {id:"diamond", x:520,y:160,w:100,h:100}
  ];

  drawTargets3(ctx, targets);

  let step = 0;
  hint.textContent = `Paso ${step+1} de ${targets.length}`;

  function handler(ev: MouseEvent){
    const rectBox = canvas.getBoundingClientRect();
    const x = ev.clientX - rectBox.left, y = ev.clientY - rectBox.top;
    const current = targets[step];
    let ok = false;
    if (current.id === "circle") { const dx = x-current.x, dy=y-current.y; ok = dx*dx+dy*dy <= (current.r!*current.r!); }
    else if (current.id === "square") { ok = x>=current.x && x<=current.x+current.w! && y>=current.y && y<=current.y+current.h!; }
    else { // diamond polygon
      const poly = [{x:current.x, y:current.y-current.h!/2},{x:current.x+current.w!/2,y:current.y},{x:current.x,y:current.y+current.h!/2},{x:current.x-current.w!/2,y:current.y}];
      ok = pointInPolygon({x,y}, poly);
    }

    if (ok) {
      markSelection3(ctx, current);
      step++;
      if (step >= targets.length) {
        canvas.removeEventListener("click", handler);
        setTimeout(()=> {
          startProgress({
            initialMsg: "¡Vas muy bien! sigue así.",
            onComplete: () => show("error1-screen"),
            speedMs: 20
          });
        }, 600);
      } else {
        hint.textContent = `Paso ${step+1} de ${targets.length}`;
      }
    } else {
      flashCanvas(canvas);
    }
  }

  canvas.addEventListener("click", handler);
}

/* -------------------------
   Captcha 4: text (legible)
   ------------------------- */

function initCaptcha4() {
  const canvas = document.getElementById("captcha4-canvas") as HTMLCanvasElement | null;
  const controls = document.getElementById("captcha4-controls");
  const hint = document.getElementById("captcha4-hint");
  if (!canvas || !controls || !hint) return;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const code = randomText(5);
  ctx.font = "48px monospace";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#133a63";
  ctx.fillText(code, 60, canvas.height/2);

  controls.innerHTML = `<input id="c4-input" placeholder="Escribe aquí" /> <button id="c4-ok">Verificar</button>`;
  const input = document.getElementById("c4-input") as HTMLInputElement;
  const ok = document.getElementById("c4-ok") as HTMLButtonElement;

  ok.addEventListener("click", () => {
    if (input.value.trim().toUpperCase() === code.toUpperCase()) {
      hint.textContent = "Correcto!";
      setTimeout(()=> {
        startProgress({
          initialMsg: "Últimos pasos... puedes hacerlo.",
          onComplete: () => show("captcha5-screen"),
          speedMs: 20
        });
      }, 450);
    } else {
      flashCanvas(canvas);
    }
  });
}

/* -------------------------
   Captcha 5: distorted text (hard)
   ------------------------- */

function initCaptcha5() {
  const canvas = document.getElementById("captcha5-canvas") as HTMLCanvasElement | null;
  const controls = document.getElementById("captcha5-controls");
  const hint = document.getElementById("captcha5-hint");
  if (!canvas || !controls || !hint) return;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const code = randomText(6);
  // draw warped characters
  const baseX = 40;
  for (let i=0;i<code.length;i++){
    const ch = code[i];
    const fs = Math.floor(Math.random()*20)+28;
    ctx.save();
    const x = baseX + i*90 + (Math.random()*20-10);
    const y = 80 + (Math.sin(i)*20) + (Math.random()*8-4);
    ctx.translate(x,y);
    ctx.rotate((Math.random()*1.2-0.6));
    ctx.font = `${fs}px Georgia`;
    ctx.fillStyle = `rgba(10,40,80,${0.6+Math.random()*0.4})`;
    ctx.fillText(ch, 0,0);
    ctx.restore();
  }
  addNoiseToCanvas(ctx, canvas, 0.18);

  controls.innerHTML = `<input id="c5-input" placeholder="Texto (sensible a mayúsculas)"/> <button id="c5-ok">Verificar</button>`;
  const input = document.getElementById("c5-input") as HTMLInputElement;
  const ok = document.getElementById("c5-ok") as HTMLButtonElement;

  ok.addEventListener("click", () => {
    if (input.value.trim() === code) {
      hint.textContent = "Correcto!";
      setTimeout(()=> {
        startProgress({
          initialMsg: "¡Último intento! Casi lo logras...",
          onComplete: () => show("error2-screen"),
          speedMs: 20
        });
      }, 450);
    } else {
      flashCanvas(canvas);
    }
  });
}

/* -------------------------
   Utility functions
   ------------------------- */

function randomText(n:number){
  const abc = "ABCDEFGHJKLMNPQRTUVWXYZ23456789";
  let s="";
  for(let i=0;i<n;i++) s+=abc.charAt(Math.floor(Math.random()*abc.length));
  return s;
}

function flashCanvas(canvas: HTMLCanvasElement) {
  canvas.style.transform = "translateX(-6px)";
  setTimeout(()=> canvas.style.transform = "translateX(6px)", 80);
  setTimeout(()=> canvas.style.transform = "translateX(0)", 160);
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "rgba(255,0,0,0.06)"; ctx.fillRect(0,0,canvas.width,canvas.height);
  setTimeout(()=> ctx.putImageData(img,0,0), 160);
}

function addNoiseToCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, alpha=0.08) {
  const w = canvas.width, h = canvas.height;
  try {
    const img = ctx.getImageData(0,0,w,h);
    for (let i=0;i<img.data.length;i+=4){
      const v = (Math.random()-0.5)*255*alpha;
      img.data[i] = clamp(img.data[i]+v,0,255);
      img.data[i+1] = clamp(img.data[i+1]+v,0,255);
      img.data[i+2] = clamp(img.data[i+2]+v,0,255);
    }
    ctx.putImageData(img,0,0);
  } catch(e) {
    // security/cors on images sometimes prevents getImageData; ignore gracefully
  }
  for (let i=0;i<12;i++){
    ctx.beginPath();
    ctx.moveTo(Math.random()*w, Math.random()*h);
    ctx.lineTo(Math.random()*w, Math.random()*h);
    ctx.strokeStyle = `rgba(20,40,80,${0.06+Math.random()*0.18})`;
    ctx.lineWidth = 1+Math.random()*2;
    ctx.stroke();
  }
}

function clamp(v:number,a:number,b:number){ return Math.max(a, Math.min(b, v)); }

function roundRect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

/* point in triangle / polygon utilities */
function pointInTriangle(p:{x:number,y:number}, a:{x:number,y:number}, b:{x:number,y:number}, c:{x:number,y:number}) {
  const area = 0.5 *(-b.y*c.x + a.y*(-b.x + c.x) + a.x*(b.y - c.y) + b.x*c.y);
  const s = 1/(2*area)*(a.y*c.x - a.x*c.y + (c.y - a.y)*p.x + (a.x - c.x)*p.y);
  const t = 1/(2*area)*(a.x*b.y - a.y*b.x + (a.y - b.y)*p.x + (b.x - a.x)*p.y);
  return s>0 && t>0 && (s+t)<1;
}

function pointInPolygon(p:{x:number,y:number}, poly:{x:number,y:number}[]) {
  let inside = false;
  for (let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi>p.y)!==(yj>p.y)) && (p.x < (xj-xi)*(p.y-yi)/(yj-yi)+xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/* draw helpers for captcha3 */
function drawTargets3(ctx: CanvasRenderingContext2D, targets:any[]) {
  // circle
  ctx.fillStyle="#5bd0ff"; ctx.beginPath(); ctx.arc(targets[0].x, targets[0].y, targets[0].r,0,Math.PI*2); ctx.fill();
  // square
  ctx.fillStyle="#85e0ff"; ctx.fillRect(targets[1].x, targets[1].y, targets[1].w, targets[1].h);
  // diamond
  ctx.save();
  ctx.translate(targets[2].x, targets[2].y);
  ctx.rotate(Math.PI/4);
  ctx.fillStyle="#3fb4ff";
  ctx.fillRect(-targets[2].w/2, -targets[2].h/2, targets[2].w, targets[2].h);
  ctx.restore();
}

function markSelection3(ctx: CanvasRenderingContext2D, t:any) {
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle="#fff";
  if (t.id==="circle") { ctx.beginPath(); ctx.arc(t.x,t.y,t.r+6,0,Math.PI*2); ctx.fill(); }
  else if (t.id==="square") ctx.fillRect(t.x-6,t.y-6,t.w+12,t.h+12);
  else { ctx.translate(t.x,t.y); ctx.rotate(Math.PI/4); ctx.fillRect(-t.w/2-6,-t.h/2-6,t.w+12,t.h+12); }
  ctx.restore();
}

/* -------------------------
   Wire up control flows & buttons beyond captchas
   ------------------------- */

// When captcha1 screen becomes active, initialize
const observer = new MutationObserver((mut) => {
  for(const m of mut) {
    if (m.type === "attributes" && (m.target as HTMLElement).classList.contains("screen")) {
      // nothing
    }
  }
});
observer.observe(document.getElementById("app")!, { attributes: false, childList:false, subtree:false });

window.addEventListener("load", () => {
  // initialize canvases when their screens are activated (simple approach: attach on load but only active handlers)
  //initCaptcha1();
  //initCaptcha2();
  //initCaptcha3();
  //initCaptcha4();
  //initCaptcha5();

  // Retry button after captcha1
  document.getElementById("retry-btn")?.addEventListener("click", () => {
    show("captcha2-screen");
  });

  // error1-screen shows then move to captcha4
  // We'll attach a timed transition from error1-screen to captcha4 when that screen shown
  // To detect screen changes, poll active class
  let lastActive = "";
  setInterval(() => {
  const activeEl = document.querySelector(".screen.active") as HTMLElement | null;
  const id = activeEl?.id ?? "";

  if (id === lastActive) return;
  lastActive = id;

  /* -----------------------------------------------------
     EVENTOS QUE OCURREN AL ENTRAR A CADA PANTALLA
     ----------------------------------------------------- */

  /* -------- Captcha 1 aparece -------- */
  if (id === "captcha1-screen") {
    initCaptcha1(); // se llama SOLO aquí
  }

  /* -------- Pantalla Retry (¡Inténtalo de nuevo!) -------- */
  if (id === "retry-btn-screen") {
    const retryBtn = document.getElementById("retry-btn");
    retryBtn?.addEventListener("click", () => {
      show("captcha2-screen");
    });
  }

  /* -------- Captcha 2 -------- */
  if (id === "captcha2-screen") {
    initCaptcha2();
  }

  /* -------- Captcha 3 -------- */
  if (id === "captcha3-screen") {
    initCaptcha3();
  }

  /* -------- Captcha 4 -------- */
  if (id === "captcha4-screen") {
    initCaptcha4();
  }

  /* -------- Captcha 5 -------- */
  if (id === "captcha5-screen") {
    initCaptcha5();
  }

  /* -------- Error inesperado 1 -------- */
  if (id === "error1-screen") {
    setTimeout(() => show("captcha4-screen"), 1200);
  }

  /* -------- Error con botón (Error 2) -------- */
  if (id === "error2-screen") {
    const btn = document.getElementById("error2-retry");
    btn?.addEventListener("click", () => {
      startProgress({
        initialMsg: "Últimos pasos... puedes hacerlo.",
        onComplete: () => show("fatal-error-screen"),
        speedMs: 20
      });
    });
  }

  /* -------- Error fatal -------- */
  if (id === "fatal-error-screen") {
    setTimeout(() => show("saved-screen"), 1400);
  }

  /* -------- Pantalla 'tu progreso está guardado' -------- */
  if (id === "saved-screen") {
    const cont = document.getElementById("continue-now");
    cont?.addEventListener("click", () => {
      show("qa-screen");
    });
  }

  /* -------- QA screen emoticons -------- */
  if (id === "qa-screen") {
    document.querySelectorAll(".emo").forEach(btn => {
      btn.addEventListener("click", () => {
        show("thankyou-screen");
      });
    });
  }

}, 200);


  // Wire up flow: after captcha2 completion -> progress -> captcha3 (handled inside initCaptcha2)
  // After captcha3 set to error1-screen (handled)
  // Captcha4 flow will after success lead to captcha5 (handled)
  // Captcha5 success leads to error2-screen (handled)
  // When error2 button pressed -> progress -> fatal-error -> saved -> continue -> qa -> thankyou

  // QA handler
  function emoClick(ev: Event) {
    const target = ev.currentTarget as HTMLElement;
    if (!target) return;
    show("thankyou-screen");
  }

  // bind other big flows:
  // After fatal error we already show saved-screen
  // After show saved-screen -> continueNow -> QA -> clicking emo -> thankyou
});

/* -------------------------
   Additional small helper: re-trigger some transitions manually
   ------------------------- */

export {}; // keep module scope
