const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Tamaño real del canvas (pantalla completa)
let ANCHO, ALTO;

function resize() {
  ANCHO = window.innerWidth;
  ALTO = window.innerHeight;
  canvas.width = ANCHO;
  canvas.height = ALTO;
}
window.addEventListener('resize', resize);
resize();

// ========== FONDO ESPACIAL ==========
function crearEstrellas() {
  const estrellas = [];
  const cantidad = Math.floor((ANCHO * ALTO) / 3500); // densidad adaptativa
  for (let i = 0; i < cantidad; i++) {
    estrellas.push({
      x: Math.random() * ANCHO,
      y: Math.random() * ALTO,
      r: Math.random() * 1.6 + 0.2,
      a: Math.random() * 0.7 + 0.25,
      velocidad: Math.random() * 0.15 + 0.02
    });
  }
  return estrellas;
}

let estrellas = crearEstrellas();

window.addEventListener('resize', () => {
  estrellas = crearEstrellas();
});

function dibujarFondo() {
  // Gradiente profundo
  const grad = ctx.createRadialGradient(
    ANCHO / 2, ALTO / 2, 0,
    ANCHO / 2, ALTO / 2, Math.max(ANCHO, ALTO) * 0.7
  );
  grad.addColorStop(0, '#12122a');
  grad.addColorStop(0.6, '#0b0b18');
  grad.addColorStop(1, '#05050c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Estrellas con ligero movimiento
  for (const e of estrellas) {
    e.y += e.velocidad;
    if (e.y > ALTO) {
      e.y = 0;
      e.x = Math.random() * ANCHO;
    }
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220, 230, 255, ${e.a})`;
    ctx.fill();
  }
}

// ========== MODELO DE LA NAVE ==========
const modeloTriangulo = [
  [0, -26],   // punta
  [-17, 18],
  [17, 18]
];

// ========== ESTADO ==========
let posX = 0;
let posY = 0;
let angulo = 0;
const escala = 1.6;

const VELOCIDAD_NAVE = 280;
const VELOCIDAD_GIRO = 200;
const VELOCIDAD_PROYECTIL = 520;
const COOLDOWN_DISPARO = 220;
const VIDA_PROYECTIL = 1600;

let proyectiles = [];
let ultimoDisparo = -COOLDOWN_DISPARO;
const teclas = {};

// Inicializar posición al centro
function centrarNave() {
  posX = ANCHO / 2;
  posY = ALTO / 2;
}
centrarNave();
window.addEventListener('resize', centrarNave);

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

// ========== TRANSFORMACIÓN 2D ==========
function transformarVertice(vertice, px, py, esc, ang) {
  let [x, y] = vertice;
  x *= esc;
  y *= esc;

  const rad = ang * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const xRot = x * cos - y * sin;
  const yRot = x * sin + y * cos;

  return [xRot + px, yRot + py];
}

// ========== BUCLE PRINCIPAL ==========
let lastTime = performance.now();

function gameLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  // Giro
  if (teclas['ArrowLeft'] || teclas['KeyA']) angulo -= VELOCIDAD_GIRO * dt;
  if (teclas['ArrowRight'] || teclas['KeyD']) angulo += VELOCIDAD_GIRO * dt;

  const rad = angulo * Math.PI / 180;

  // Movimiento
  if (teclas['KeyW'] || teclas['ArrowUp']) {
    posX += Math.sin(rad) * VELOCIDAD_NAVE * dt;
    posY -= Math.cos(rad) * VELOCIDAD_NAVE * dt;
  }
  if (teclas['KeyS'] || teclas['ArrowDown']) {
    posX -= Math.sin(rad) * VELOCIDAD_NAVE * dt;
    posY += Math.cos(rad) * VELOCIDAD_NAVE * dt;
  }

  // Disparo
  if (teclas['Space'] && now - ultimoDisparo >= COOLDOWN_DISPARO) {
    const [puntaX, puntaY] = transformarVertice(
      modeloTriangulo[0], posX, posY, escala, angulo
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

  // Actualizar proyectiles
  for (const p of proyectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vida -= dt * 1000;
  }

  proyectiles = proyectiles.filter(p =>
    p.x >= -20 && p.x < ANCHO + 20 &&
    p.y >= -20 && p.y < ALTO + 20 &&
    p.vida > 0
  );

  // Pantalla envolvente
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

  // Brillo sutil de la nave
  ctx.shadowColor = 'rgba(80, 255, 150, 0.55)';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#50ff96';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Proyectiles
  for (const p of proyectiles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdc50';
    ctx.shadowColor = 'rgba(255, 220, 80, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
