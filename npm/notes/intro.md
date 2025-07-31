
⊙ this.me – Browser Integration Guide
✅ ¿Qué es this.me?

this.me es una librería autocontenida que se conecta al daemon local de this.me (corriendo usualmente en localhost:7777).
Su objetivo es proveer una instancia viva en el navegador, capaz de:
	•	Consultar si el daemon está activo (status).
	•	Listar identidades registradas (listUs).
	•	Mantenerse sincronizada en tiempo real vía WebSocket.
⸻

✅ Instancia única y global
Al cargar la librería:
	•	Se crea automáticamente una instancia única de la clase Me.
	•	En el navegador, esta instancia se expone como window.me.

console.log(window.me);

Si la importas en React o cualquier bundler:
import me from "this.me";

⸻

✅ Inicialización
La inicialización ocurre en dos fases:
	1.	Automática al cargar:
	•	En el constructor, la clase ya ejecuta:

me.status();
	•	Esto intenta consultar el daemon inmediatamente.
	2.	Manual para estado completo:
	•	Para levantar status + listUs + WebSocket:

await me.init();

⸻

✅ Principales métodos
1. status()

Consulta si el daemon está activo:
const s = await me.status();
console.log(s);
// { active: true, version: "0.1.0", uptime: "..." }


⸻

2. listUs()
Lista todas las identidades disponibles:

const us = await me.listUs();
console.log(us);
// [ { alias: "suign", path: "/Users/abellae/.this/me/suign" } ]


⸻

3. startSocket()
Abre el WebSocket con el daemon para mantener sincronización en tiempo real.
await me.startSocket();

me.subscribe((state) => {
  console.log("🆕 Estado actualizado:", state);
});

El socket recibe actualizaciones automáticas de status y en el futuro también de eventos en tiempo real.
⸻

✅ Estado Reactivo
La instancia mantiene un state interno accesible así:

console.log(me.getState());
// { status: { active: true, ... }, listUs: [...], activeMe: null }

Puedes suscribirte a cambios:

const unsubscribe = me.subscribe((newState) => {
  console.log("Nuevo estado:", newState);
});

// Para dejar de escuchar:
// unsubscribe();


⸻

✅ Ejemplo rápido en un HTML

<script src="./dist/this.me.browser.js"></script>
<script>
  // Instancia ya disponible
  console.log(window.me);

  // Inicializar estado completo
  me.init().then(() => {
    console.log("Status:", me.getState().status);
    console.log("ListUs:", me.getState().listUs);
  });
</script>


⸻

✅ Flujo resumido
	1.	Daemon encendido → status() verifica que esté activo.
	2.	Se inicializa con init() → obtiene status y listUs.
	3.	WebSocket activo → mantiene el estado en tiempo real.
	4.	La instancia me es viva → cualquier componente o script puede consumirla directamente.

⸻

