"""
Simulación 2D: Nave vectorial + proyectiles
"""

import pygame
import sys
import math
import os

# 1.- Inicializar Pygame y los subsistemas de hardware
pygame.init()

# Definir el tamaño de la ventana
ANCHO, ALTO = 800, 600

# Crear ventana con doble búfer
pantalla = pygame.display.set_mode(
    (ANCHO, ALTO), pygame.DOUBLEBUF
)
pygame.display.set_caption("Nave vectorial y proyectiles 2D")
reloj = pygame.time.Clock()

# 2.- Cargar el fondo de estrellas
carpeta = os.path.dirname(os.path.abspath(__file__))
ruta_fondo = os.path.join(carpeta, "estrellas.jpg")

try:
    fondo = pygame.image.load(ruta_fondo).convert()
    fondo = pygame.transform.scale(fondo, (ANCHO, ALTO))
except pygame.error:
    print("No se pudo cargar estrellas.jpg")
    fondo = None

# 3.- Función de transformación geométrica 2D
def transformar_vertice(vertice, pos_x, pos_y, escala, angulo):
    x, y = vertice

    # Escalamiento
    x_esc, y_esc = x * escala, y * escala

    # Rotación
    rad = math.radians(angulo)
    x_rot = x_esc * math.cos(rad) - y_esc * math.sin(rad)
    y_rot = x_esc * math.sin(rad) + y_esc * math.cos(rad)

    # Traslación al espacio de la pantalla
    return (x_rot + pos_x, y_rot + pos_y)


# 4.- Modelo local de la nave
# La punta se encuentra en (0, -25)
modelo_triangulo = [(0, -25), (-18, 18), (18, 18)]

# Posición y orientación inicial
pos_x, pos_y = 400.0, 300.0
angulo = 0.0
escala = 1.5

# Velocidades
VELOCIDAD_NAVE = 220
VELOCIDAD_LATERAL = 220
VELOCIDAD_GIRO = 180
VELOCIDAD_PROYECTIL = 420

# Configuración de disparos
COOLDOWN_DISPARO = 250
VIDA_PROYECTIL = 1800

# Lista dinámica de proyectiles
proyectiles = []
ultimo_disparo = -COOLDOWN_DISPARO

# 5.- Bucle principal
ejecutando = True

while ejecutando:

    # Controlar 60 FPS
    dt = reloj.tick(60) / 1000.0

    # Procesar eventos
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            ejecutando = False

    # Leer las teclas presionadas
    teclas = pygame.key.get_pressed()

    # 6.- Girar la nave con las flechas
    if teclas[pygame.K_LEFT]:
        angulo -= VELOCIDAD_GIRO * dt

    if teclas[pygame.K_RIGHT]:
        angulo += VELOCIDAD_GIRO * dt

    # 7.- Movimiento horizontal original
    # A y flecha izquierda: girar a la izquierda
    if teclas[pygame.K_a] or teclas[pygame.K_LEFT]:
        angulo -= VELOCIDAD_GIRO * dt

    # D y flecha derecha: girar a la derecha
    if teclas[pygame.K_d] or teclas[pygame.K_RIGHT]:
        angulo += VELOCIDAD_GIRO * dt

    # 8.- Avance vectorial según la orientación
    rad = math.radians(angulo)

    # W o flecha arriba: avanzar hacia la punta
    if teclas[pygame.K_w] or teclas[pygame.K_UP]:
        pos_x += math.sin(rad) * VELOCIDAD_NAVE * dt
        pos_y -= math.cos(rad) * VELOCIDAD_NAVE * dt

    # S o flecha abajo: retroceder
    if teclas[pygame.K_s] or teclas[pygame.K_DOWN]:
        pos_x -= math.sin(rad) * VELOCIDAD_NAVE * dt
        pos_y += math.cos(rad) * VELOCIDAD_NAVE * dt

    # 9.- Generación de proyectiles
    tiempo_actual = pygame.time.get_ticks()

    if (
        teclas[pygame.K_SPACE]
        and tiempo_actual - ultimo_disparo >= COOLDOWN_DISPARO
    ):
        # Obtener la posición transformada de la punta
        punta_x, punta_y = transformar_vertice(
            modelo_triangulo[0],
            pos_x,
            pos_y,
            escala,
            angulo
        )

        # Crear proyectil con posición, velocidad y vida
        proyectiles.append({
            "x": punta_x,
            "y": punta_y,
            "vx": math.sin(rad) * VELOCIDAD_PROYECTIL,
            "vy": -math.cos(rad) * VELOCIDAD_PROYECTIL,
            "vida": VIDA_PROYECTIL
        })

        ultimo_disparo = tiempo_actual

    # 10.- Actualizar los proyectiles
    for proyectil in proyectiles:
        proyectil["x"] += proyectil["vx"] * dt
        proyectil["y"] += proyectil["vy"] * dt
        proyectil["vida"] -= dt * 1000

    # Eliminar proyectiles fuera de pantalla o sin vida
    proyectiles = [
        p for p in proyectiles
        if 0 <= p["x"] < ANCHO
        and 0 <= p["y"] < ALTO
        and p["vida"] > 0
    ]

    # 11.- Pantalla envolvente para la nave
    pos_x %= ANCHO
    pos_y %= ALTO

    # 12.- Dibujar el fondo de estrellas
    if fondo is not None:
        pantalla.blit(fondo, (0, 0))
    else:
        pantalla.fill((25, 25, 35))

    # Transformar los vértices de la nave
    vertices_pantalla = [
        transformar_vertice(v, pos_x, pos_y, escala, angulo)
        for v in modelo_triangulo
    ]

    # Dibujar la nave
    pygame.draw.polygon(
        pantalla,
        (50, 255, 150),
        vertices_pantalla,
        2
    )

    # Dibujar los proyectiles
    for proyectil in proyectiles:
        pygame.draw.circle(
            pantalla,
            (255, 220, 80),
            (int(proyectil["x"]), int(proyectil["y"])),
            4
        )

    # Actualizar la pantalla con doble búfer
    pygame.display.flip()

# 13.- Finalizar Pygame
pygame.quit()
sys.exit()
