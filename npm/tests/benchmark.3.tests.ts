import ME from "this.me";

async function runProfile(n) {
  const me = new ME();
  
  // 1. Setup (esto es lo que tarda, estamos creando miles de Proxies)
  for (let i = 1; i <= n; i++) {
    me.x[i].value(10);
  }
  
  me.factor(5);
  // Definimos la regla broadcast
  me.x["[i]"]["="]("y", "value * factor");
  
  // Warmup: forzamos al Kernel a mapear los cables (Inverted Index)
  me(`x[${n}].y`); 

  // --- LA PRUEBA DE FUEGO ---
  const start = performance.now();
  
  me.factor(10); // Mutación de 1 solo nodo
  const val = me(`x[${n}].y`); // Verificación de reacción
  
  const end = performance.now();
  const time = (end - start).toFixed(4);
  
  return { n, time, effort: 2, result: val };
}

async function start() {
  const sizes = [10, 100, 1000, 5000, 10000];
  console.log("n,time_ms,effort_steps,status");

  for (const n of sizes) {
    // Mensaje de progreso para que no pienses que se trabó
    process.stderr.write(`> Procesando N=${n}... `); 
    
    const r = await runProfile(n);
    
    process.stderr.write(`Hecho.\n`);
    console.log(`${r.n},${r.time},${r.effort},OK`);
  }
  console.log("\n--- Benchmark Finalizado ---");
}

start().catch(console.error);