Diseño técnico y operativo para administrar la flota “algorítmica e inteligente”, con foco en minimizar costos y asignar configuraciones óptimas.

# **Objetivo**

- **Minimizar costo total** de operación (combustible, tiempo de operador, peajes, penalizaciones por retraso, reconfiguraciones, ociosidad).
- **Asignar** cada *programa* (pedido/entrega) a una **configuración** válida (tractocamión + 0..n remolques + 0..n dollies + operador) y **ruta** factible.
- **Respetar** restricciones legales/técnicas: HOS (horas de servicio), compatibilidades, capacidades, ventanas de tiempo, mantenimiento.

# **Entidades (campos clave)**

- **Tractocamión**
  - id, placa, **pos**(lat,lon), **combustible_actual**, **rendimiento_km_l**, **costo_litro_ref**, **capacidad_arrastre(tn)**, **compatibilidades**(tipos de remolque), **estado**(disponible/taller/en_ruta).
- **Remolque**
  - id, tipo (caja/jaula/plataforma/tolva), **capacidad(tn/m³)**, **compatibilidad_dolly**(sí/no), **estado**, **ubicación**.
- **Dolly**
  - id, tipo, **compatibilidad_remolque**, **estado**, **ubicación**.
- **Llantas** (si se gestionan individualmente): id, **km_acumulado**, **vida_%**, **posición** (por eje), **alertas**.
- **Operador**
  - id, **licencias**, **jornada_restante_h**, **costo_h**, **base**, **restricciones** (rutas, nocturno), **calificación_riesgo**.
- **Utilitarios** (apoyo): id, tipo, disponibilidad, costo_h.
- **Ruta**
  - id, **tramos** [origen→destino, **km**, **peajes**, **restricciones_altura/peso**], **SLAs**.
- **Programa** (orden de transporte)
  - id, **origen/destino**, **ventana_tiempo** [early, late], **demanda** (tn, m³, pallets), **prioridad**, **equipamiento_requerido** (p.ej. full, sencillo, refrigerado), **SLA**.
- **Configuración** (combinación concreta)
  - id, **tracto_id**, **remolques_ids[]**, **dollies_ids[]**, **operador_id**.

# **Restricciones principales**

- **Capacidad**: demanda_programa ≤ capacidad_total(configuración).
- **Compatibilidad**: tracto–remolque–dolly deben ser compatibles; equipo frío si requerido.
- **HOS**: horas de conducción + servicio ≤ jornada_restante_operador.
- **Ventanas de tiempo**: llegada dentro de [early, late] (o con penalización).
- **Ubicación y redisposición**: activos deben poder llegar a origen (considerar “viaje en vacío” y reconfiguración).
- **Mantenimiento**: activos con mantenimiento programado no son elegibles.
- **Peso/altura por ruta**: no exceder límites por tramo.

# **Función de costo (ejemplo)**

Para una asignación (programa *p* → configuración *c* → ruta *r*):

- **Combustible**: \text{km}_r \times \text{consumo}_c(\text{l/km}) \times \text{precio\_l}
- **Operador**: \text{tiempo}_r(h) \times \text{costo\_h\_operador}
- **Peajes**: suma peajes por tramo y ejes.
- **Reconfiguración/Reposicionamiento**: costo fijo + km vacíos previos.
- **Penalizaciones**:
  - retraso: \alpha \times \max(0, t_{\text{llegada}} - \text{late})
  - ventanas tempranas (si no se permite staging): \beta \times \max(0, \text{early} - t_{\text{llegada}})
  - riesgo/seguridad (si aplica): \gamma \times \text{riesgo\_ruta}

**Objetivo**: minimizar \sum_{p,c,r} x_{pcr} \cdot \text{Costo}(p,c,r)

# **Formulación (MILP simplificada)**

- Variables:
  - x_{pcr} \in \{0,1\}: programa *p* asignado a config *c* y ruta *r*.
  - y_{ac} \in \{0,1\}: activo *a* pertenece a config *c*.
  - Variables de tiempo T^{arr}_p, T^{sal}_p y secuenciación si hay múltiples paradas.
- Restricciones (muestra):
  1. **Cobertura**: \sum_{c,r} x_{pcr} = 1 \quad \forall p
  2. **Capacidad**: \sum_{p} x_{pcr}\cdot demanda_p \leq capacidad_c \quad \forall c,r
  3. **Compatibilidad** (lógicas) y **Disponibilidad**: cada activo en una configuración activa sólo en un plan a la vez.
  4. **HOS**: \(T^{arr}_p - T^{sal}_p \leq \text{jornada\restante}{operador(c)}\)
  5. **Ventanas**: early_p \leq T^{arr}_p \leq late_p + s_p (slack s_p con penalización).
  6. **Flujo/Posición**: si activo *a* está en loc *L* y viaje inicia en *O*, exigir pre-movimiento km(L,O) y tiempo.

> En la práctica, se resuelve en dos niveles:

1. > **Asignación y configuración** (MILP / CP-SAT),

2. > **Secuenciación y ruteo** (VRP con ventanas de tiempo; heurísticas: Savings, Tabu, ALNS; o metaheurística híbrida).

# **Pipeline de optimización (ciclo diario o rolling horizon)**

1. **Ingesta & normalización**: telemetría GPS, niveles de combustible, estado llantas, horas operador, disponibilidad.

2. **Generación de candidatos**: filtrar configuraciones válidas por programa (capacidad, compatibilidad, proximidad).

3. **Estimación de costos** por candidato (combustible, peajes, tiempo, penalidades).

4. **Optimización**:

   

   - rápido: heurística (Savings/Greedy + 2-opt/3-opt) para solución inicial,
   - fino: MILP/CP-SAT con límites de tiempo y “warm start”.

   

5. **Validación operacional**: reglas de seguridad, mantenimiento, restricciones de cliente.

6. **Plan ejecutable**: órdenes a tracto/operador, checklist de acople (remolques/dollies), combustible sugerido.

7. **Monitoreo y replanificación**: ante desvíos, recalcular parcialmente (local search on-line).

# **Datos & esquema (mínimo viable)**

- tractos(id, placa, lat, lon, rendimiento_km_l, costo_litro, capacidad_tn, estado, compat_tipos_remolque[])
- remolques(id, tipo, capacidad_tn, m3, compat_dolly, estado, lat, lon)
- dollies(id, tipo, estado, lat, lon)
- operadores(id, costo_h, jornada_restante_h, licencias[], base_lat, base_lon, restricciones[])
- rutas(id, tramos[]) con tramos(origen, destino, km, peajes, limite_altura, limite_peso, riesgo)
- programas(id, origen, destino, demanda_tn, m3, ventana_early, ventana_late, prioridad, equipamiento_req)
- configuraciones(id, tracto_id, remolques_ids[], dollies_ids[], operador_id)
- costos(id_programa, id_configuracion, id_ruta, costo_total, breakdown_json)

# **Reglas de negocio clave (ejemplos)**

- **Full** (doble remolque) requiere 1 dolly y tracto con potencia ≥ umbral.
- **Rutas restringidas**: si *full* no permitido en tramo, dividir trayecto o cambiar config a “sencillo”.
- **Llantas**: si vida_% < umbral, bloquear asignación o forzar paso por taller.
- **Combustible**: si combustible_actual no cubre km estimado + reserva, insertar parada de carga (optimizar estación).

# **KPIs para control**

- Costo por km, costo por tonelada-km.
- % cumplimiento de ventanas (OTD).
- Km en vacío / total.
- Utilización de activos (% tiempo útil vs. ocioso).
- Penalizaciones evitadas/incurridas.
- Reconfiguraciones por día.

# **Flujo operativo (día a día)**

1. Cargar **programas** del día (o horizonte T horas).
2. Actualizar estados de **activos** (GPS, combustible, mantenimiento).
3. Ejecutar **optimizador** → plan.
4. Emitir **instrucciones** (acople, secuencia de paradas, combustible).
5. Monitorear → **replanificar** ante incidencias (accidente, cierre, retraso).
6. Cierre: **liquidación de costos** y aprendizaje (ajuste de rendimientos, tiempos reales).

# **API (borrador)**

POST /programas (alta), GET /programas?estado=pending

- GET /activos/estado (tractos, remolques, dollies, operadores)
- POST /optimize?horizon=24h&objective=min_cost
- GET /plan/:id (instrucciones por activo)
- POST /telemetria/gps, POST /telemetria/combustible
- POST /eventos/incidencia (rehacer parcial)

# **Ejemplo de entrada (programa) y costo (pseudo)**



```
{
  "programa": {
    "id": "P-1042",
    "origen": "MX-MTY",
    "destino": "MX-QRO",
    "demanda_tn": 42,
    "ventana": {"early": "2025-08-18T12:00", "late": "2025-08-18T18:00"},
    "equipamiento_req": "full"
  },
  "configuracion": {
    "tracto_id": "T-22",
    "remolques_ids": ["R-88","R-91"],
    "dollies_ids": ["D-12"],
    "operador_id": "O-07"
  },
  "ruta": {
    "km": 770,
    "peajes": 1450,
    "tiempo_h": 10.8
  },
  "parametros": {
    "consumo_l_km": 0.48,
    "precio_l": 24.5,
    "costo_h_operador": 180,
    "costo_reconfig": 600
  }
}
```

**Costo estimado** (ilustrativo)

- Combustible ≈ 770 × 0.48 × 24.5 = $9,058
- Operador ≈ 10.8 × 180 = $1,944
- Peajes = $1,450
- Reconfig = $600
- **Total ≈ $13,052** (+ penalizaciones si aplica)

# **Roadmap de implementación**

1. **MVP**: reglas duras + heurística greedy con costos calibrables.
2. **Optimizador**: CP-SAT/MILP (OR-Tools o equivalente) con warm start de la heurística.
3. **Telemetría**: integración GPS/combustible; normalización de datos.
4. **Mantenimiento & llantas**: reglas preventivas + score de riesgo.
5. **Replanificación en vivo**: heurística local (swap/2-opt) ante incidentes.
6. **Panel**: KPIs, mapa, alertas de ventanas/HOS/combustible.

------

