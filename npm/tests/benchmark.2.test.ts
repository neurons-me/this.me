import ME from "this.me";

async function runProfile(n) {
  const me = new ME();
  // Setup masivo
  for (let i = 1; i <= n; i++) me.x[i](10);
  me.factor(5);
  me.x["[i]"]["="]("y", "x * factor");
  me("x[1].y"); // Warmup

  const start = performance.now();
  me.factor(10); // La mutación
  me(`x[${n}].y`); // Force check
  const end = performance.now();
  
  return { n, time: (end - start).toFixed(4), effort: 2 }; 
}

const sizes = [10, 100, 500, 1000, 2500, 5000, 7500, 10000];
console.log("n,time_ms,effort_steps");
sizes.forEach(async (s) => {
  const r = await runProfile(s);
  console.log(`${r.n},${r.time},${r.effort}`);
});