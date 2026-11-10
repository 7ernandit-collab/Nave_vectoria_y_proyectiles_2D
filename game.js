const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const ANCHO = 800;
const ALTO = 600;

// ========== FONDO CON ESTRELLAS ==========
function dibujarFondo() {
  // Gradiente espacial
  const grad = ctx.createLinearGradient(0, 0, 0, ALTO);
  grad.addColorStop(0, '#0b0b18');
  grad.addColorStop(1, '#12122a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Estrellas fijas (se generan solo una vez)
  if (!window._estrellas) {
    window._estrellas = [];
    for (let i = 0; i < 180; i++) {
      window._estrellas.push({
        x: Math.random() * ANCHO,
        y: Math.random() * ALTO,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.6 + 0.3
      });
    }
  }

  for (const e of window._estrellas) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${e.a})`;
    ctx.fill();
  }
}

// ========== MODELO DE LA NAVE ==========
const modeloTriangulo = [
  [0, -25],   // punta
  [-18, 18],  // esquina izquierda
  [18, 18]    // esquina derecha
];

// ========== ESTADO DEL JUEGO ==========
let posX = 400;
let posY = 300;
let angulo = 0;
const escala = 1.5;

const VELOCIDAD_NAVE = 220;
const VELOCIDAD_GIRO = 180;
const VELOCIDAD_PROYECTIL = 420;
const COOLDOWN_DISPARO = 250;
const VIDA_PROYECTIL = 1800;

let proyectiles = [];
let ultimoDisparo = -COOLDOWN_DISPARO;
const teclas = {};

// ========== TECLADO ==========
window.addEventListener('keydown', (e) => {
  teclas[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  teclas[e.code] = false;
});

// ========== TRANSFORMACIÓN GEOMÉTRICA 2D ==========
function transformarVertice(vertice, px, py, esc, ang) {
  let [x, y] = vertice;

  // Escalamiento
  x *= esc;
  y *= esc;

  // Rotación
  const rad = ang * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const xRot = x * cos - y * sin;
  const yRot = x * sin + y * cos;

  // Traslación
  return [xRot + px, yRot + py];
}

// ========== BUCLE PRINCIPAL ==========
let lastTime = performance.now();

function gameLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05); // límite de dt
  lastTime = now;

  // --- Giro ---
  if (teclas['ArrowLeft'] || teclas['KeyA']) {
    angulo -= VELOCIDAD_GIRO * dt;
  }
  if (teclas['ArrowRight'] || teclas['KeyD']) {
    angulo += VELOCIDAD_GIRO * dt;
  }

  const rad = angulo * Math.PI / 180;

  // --- Movimiento ---
  if (teclas['KeyW'] || teclas['ArrowUp']) {
    posX += Math.sin(rad) * VELOCIDAD_NAVE * dt;
    posY -= Math.cos(rad) * VELOCIDAD_NAVE * dt;
  }
  if (teclas['KeyS'] || teclas['ArrowDown']) {
    posX -= Math.sin(rad) * VELOCIDAD_NAVE * dt;
    posY += Math.cos(rad) * VELOCIDAD_NAVE * dt;
  }

  // --- Disparo ---
  if (teclas['Space'] && now - ultimoDisparo >= COOLDOWN_DISPARO) {
    const [puntaX, puntaY] = transformarVertice(
      modeloTriangulo[0],
      posX,
      posY,
      escala,
      angulo
    );

    proyectiles.push({
      x: puntaX,
      y: puntaY,
      vx: Math.sin(rad) * VELOCIDAD_PROYECTIL,
      vy: -Math.cos(rad) * VELOCIDAD_PROYECTIL,
      vida: VIDA_PROYECTIL
    });

    ultimoDisparo = now;
  }

  // --- Actualizar proyectiles ---
  for (const p of proyectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vida -= dt * 1000;
  }

  proyectiles = proyectiles.filter(p =>
    p.x >= 0 && p.x < ANCHO &&
    p.y >= 0 && p.y < ALTO &&
    p.vida > 0
  );

  // --- Pantalla envolvente ---
  posX = ((posX % ANCHO) + ANCHO) % ANCHO;
  posY = ((posY % ALTO) + ALTO) % ALTO;

  // ========== DIBUJAR ==========
  dibujarFondo();

  // Nave
  const vertices = modeloTriangulo.map(v =>
    transformarVertice(v, posX, posY, escala, angulo)
  );

  ctx.beginPath();
  ctx.moveTo(vertices[0][0], vertices[0][1]);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i][0], vertices[i][1]);
  }
  ctx.closePath();
  ctx.strokeStyle = '#32ff96';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Proyectiles
  ctx.fillStyle = '#ffdc50';
  for (const p of proyectiles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(gameLoop);
}

// Iniciar el juego
requestAnimationFrame(gameLoop);
