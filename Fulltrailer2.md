**Modelo letrado** (sin código), pensado para que cualquier persona del equipo entienda qué es cada tabla, qué guarda y cómo se relaciona. Piensa en cada tabla como una “ficha” de cosas del mundo real.

# **Programa, Viajes y Configuraciones**

**Programa**

- **Qué es:** Un pedido o contrato de transporte que puede requerir varios viajes.
- **Para qué sirve:** Agrupa todo lo que hay que mover para un cliente dentro de cierto periodo/condiciones.
- **Campos clave (en simple):**
  - Cliente, descripción, prioridad.
  - Ventana de entrega (desde/hasta).
  - Equipo requerido (ej.: sencillo, full, refrigerado).
- **Ejemplo:** “Llevar 120 t de mercancía de Monterrey a Querétaro esta semana, con equipo refrigerado.”

**Viaje** (pertenece a un Programa)

- **Qué es:** La unidad operativa que realmente se ejecuta en ruta (origen→destino).
- **Para qué sirve:** Planificar y dar seguimiento a cada traslado específico.
- **Campos clave:**
  - Origen, destino.
  - Demanda (toneladas / volumen).
  - Ruta elegida (si ya se definió).
  - Tiempos: salida y llegada planificada/real.
  - Estado (planificado, asignado, en progreso, completado, cancelado).
- **Ejemplo:** “Viaje 1 de 4 para el Programa X: 30 t MTY→QRO, salida hoy 10:00, llegada hoy 20:30.”

**Configuración del viaje** (qué equipo y quién lo opera)

- **Qué es:** La combinación concreta asignada a ese viaje.
- **Para qué sirve:** Saber qué tracto, qué remolques, qué dolly y qué operador harán el viaje.
- **Campos clave:**
  - Tractocamión asignado, operador asignado.
  - Remolques usados (delantero/trasero/único).
  - Dollies usados (si aplica).
- **Ejemplo:** “Tracto T-22 + Remolques R-88 (delantero) y R-91 (trasero) + Dolly D-12 + Operador O-07.”

------

# **Identidades (los activos y las personas)**

**Tractocamiones**

- **Qué son:** Los cabezales o “tractos” que jalan los remolques.
- **Para qué sirven:** Motor de la operación; su estado y capacidad condicionan qué se puede mover.
- **Campos clave:**
  - Marca, modelo, año, placas.
  - Ubicación actual (lat/lon).
  - Kilometraje, tipo de aceite (mantenimiento), rendimiento de combustible.
  - Capacidad de arrastre (toneladas) y estado (disponible, en ruta, en taller).
- **Pregunta que responde:** ¿Qué tractos están disponibles cerca y pueden con este peso?

**Remolques**

- **Qué son:** Las cajas/plataformas donde va la mercancía.
- **Para qué sirven:** Aportan capacidad; su tipo define qué carga pueden llevar.
- **Campos clave:**
  - Tipo (caja, plataforma, jaula, refrigerado, tanque, etc.).
  - Capacidad (toneladas/volumen), ejes (impacta peajes).
  - Posición actual y estado.
  - Indicadores “delantero/trasero” (si se usa configuración full).
- **Pregunta que responde:** ¿Qué remolques cumplen el equipo requerido y están cerca?

**Dollies**

- **Qué son:** Los “convertidores” que permiten unir un segundo remolque (full).
- **Para qué sirven:** Habilitan configuraciones de doble remolque.
- **Campos clave:**
  - Modelo, ejes, ubicación y estado.
- **Pregunta que responde:** ¿Hay un dolly disponible y compatible para armar un full?

**Operadores (conductores)**

- **Qué son:** Las personas que manejan los tractos.
- **Para qué sirven:** Su licencia, experiencia y horas disponibles habilitan o limitan la asignación.
- **Campos clave:**
  - Nombre, licencia (tipo), años de experiencia, edad.
  - Ubicación/base actual.
  - Costo por hora y disponibilidad (horas de servicio restantes).
- **Pregunta que responde:** ¿Qué operador está habilitado y disponible para este viaje?

**Llantas**

- **Qué son:** Inventario de llantas con su historial de uso.
- **Para qué sirven:** Seguridad, costos y disponibilidad (no asignar equipo con llantas al límite).
- **Campos clave:**
  - Marca, modelo, medida.
  - Vida útil (%) y kilómetros acumulados.
  - Estado (ok, reparación, baja).
- **Montaje (historial):** Registro de en qué vehículo y posición está/estuvo montada cada llanta.
- **Pregunta que responde:** ¿Qué llantas están montadas ahora y cuáles necesitan cambio?

# **Rutas y operación en camino**

**Rutas**

- **Qué son:** Caminos “tipo receta” entre origen y destino.
- **Para qué sirven:** Estandarizar distancia, tiempos, costos estimados y restricciones.
- **Campos clave:**
  - Nombre, origen, destino.
  - Kilómetros totales, horas promedio.
  - Restricciones (altura, peso, pasos complicados).

**Tramos de ruta** (partes de una ruta)

- **Qué son:** Segmentos ordenados que componen una ruta.
- **Para qué sirven:** Detallar peajes, límites y particularidades por sección.
- **Campos clave:**
  - Origen del tramo, destino del tramo.
  - Kilómetros y peajes del tramo.
  - Límites de altura/peso si aplican.
- **Pregunta que responde:** ¿Cuánto cuesta y qué restricciones tiene cada parte del camino?

**Puntos de interés (POI)**

- **Qué son:** Lugares relevantes en o cerca de una ruta.
- **Para qué sirven:** Paradas de descanso, combustible, talleres, peajes, controles.
- **Campos clave:**
  - Tipo (gasolinera, descanso, taller, peaje, etc.).
  - Servicios disponibles (baños, comida, diésel, hotel, DEF).
  - Distancia o desvío respecto a la ruta.
- **Pregunta que responde:** ¿Dónde conviene parar a cargar, descansar o atender una falla?

------

# **Seguimiento, costos y salud de la operación**

**Telemetría de posiciones**

- **Qué es:** El “GPS histórico” de tractos, remolques y dollies.
- **Para qué sirve:** Ver dónde están, por dónde pasaron y a qué velocidad.
- **Campos clave:**
  - Vehículo, fecha/hora, ubicación, velocidad.
- **Pregunta que responde:** ¿Dónde está mi flota y cómo va el viaje?

**Eventos de combustible**

- **Qué es:** Registro de cargas de combustible.
- **Para qué sirve:** Control de gasto y cálculo de rendimiento real.
- **Campos clave:**
  - Vehículo, fecha/hora, litros cargados, precio por litro, odómetro.
- **Pregunta que responde:** ¿Cuánto estamos gastando en diésel y con qué rendimiento?

**Mantenimientos**

- **Qué es:** Agenda y bitácora de servicios (preventivos y correctivos).
- **Para qué sirve:** Evitar fallas y planear indisponibilidades.
- **Campos clave:**
  - Vehículo, tipo de mantenimiento, descripción.
  - Fecha programada/real y meta de kilómetros.
- **Pregunta que responde:** ¿Qué activos estarán fuera de servicio y cuándo?

**Horas de servicio (HOS) del operador**

- **Qué es:** Registro diario de conducción, servicio y descanso.
- **Para qué sirve:** Cumplir normas y evitar sobrecarga de trabajo.
- **Campos clave:**
  - Operador, fecha, horas de conducción/servicio/descanso.
- **Pregunta que responde:** ¿Cuántas horas le quedan hoy a cada operador?

------

# **Cómo se relaciona todo (mapa mental rápido)**

- Un **Programa** tiene **varios Viajes**.
- Cada **Viaje** se ejecuta con una **Configuración**: un **Tracto**, uno o dos **Remolques**, cero o un **Dolly** y un **Operador**.
- Cada **Viaje** usa una **Ruta**, que está compuesta por **Tramos** y puede tener **Puntos de interés** asociados.
- **Llantas** se montan/desmontan en **Tractos**, **Remolques** o **Dollies**, y se sigue su **historial**.
- La **Telemetría** y los **Eventos de combustible** registran lo que pasa en tiempo real.
- **Mantenimientos** y **Horas de servicio** limitan qué se puede asignar y cuándo.

------

# **KPI que salen directo del modelo (para decidir mejor)**

- **Costo por km / tonelada-km** (combustible, peajes, operador).
- **Cumplimiento de ventanas** (entregas a tiempo).
- **Km en vacío** (reposicionamiento) vs. km productivos.
- **Utilización de activos** (tiempo útil vs. ocioso).
- **Salud de llantas** (vida útil promedio, alertas).
- **Disponibilidad de operadores** (horas restantes).

------

# **Ejemplo narrado (de punta a punta)**

1. El **cliente** pide mover mercancía: creamos un **Programa** con ventana de entrega y equipo “full”.
2. Lo dividimos en **4 Viajes** (cada uno 30 t).
3. Para el **Viaje 1**, elegimos una **Ruta** MTY→QRO con sus **Tramos** (sabemos peajes y límites).
4. Buscamos **Configuración**: un **Tracto** disponible cercano, **dos Remolques** compatibles, **un Dolly** y un **Operador** con licencia y horas suficientes.
5. Verificamos **Llantas** montadas y **Mantenimientos** para no asignar equipo no apto.
6. Ejecutamos: la **Telemetría** reporta posiciones; si se requiere, paramos en un **POI** (gasolinera) y registramos **Evento de combustible**.
7. Cerramos el viaje con tiempos reales y calculamos **costos** y **KPIs**.

------



**Diagrama visual** con ejemplos de filas “de muestra” para que el equipo de operaciones lo valide antes de pasar a software.