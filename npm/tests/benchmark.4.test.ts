import ME from "this.me";

async function runTest(name: string, setupFn: (me: any) => void, mutationPath: string, checkPath: string) {
    const me = new ME() as any;
    setupFn(me);
    
    // Warmup para que el Grafo de Dependencias se asiente
    me(checkPath); 

    const start = performance.now();
    // La Mutación Quirúrgica
    me[mutationPath](Math.random()); 
    const val = me(checkPath);
    const end = performance.now();
    
    const trace = me.explain(checkPath);
    console.log(`\n[${name}]`);
    console.log(`> Latency: ${(end - start).toFixed(4)}ms`);
    console.log(`> Effort (k): ${trace.meta.dependsOn.length} nodes`);
    console.log(`> Status: ${trace.meta.dependsOn.length > 0 ? "✅ Reactive" : "❌ Static"}`);
}

async function startLab() {
    console.log("========================================================");
    console.log(" .me KERNEL: MULTI-DATASET STRESS LAB");
    console.log(" Author: suiGn | jose abella eggleton");
    console.log("========================================================\n");

    // ESCENARIO 1: EL RASCACIELOS (Profundidad Extrema)
    // ¿Qué pasa si el dato está a 500 niveles de profundidad?
    await runTest("DEEP_NESTING (500 levels)", (me) => {
        let curr = me.root;
        for(let i=0; i<500; i++) curr = curr[`n${i}`];
        curr.value(10);
        me.factor(2);
        curr["="]("result", `value * factor`);
    }, "factor", "root.n499.result");

    // ESCENARIO 2: LA RED (Alta Interconectividad)
    // 1,000 nodos que dependen de 1 solo "Master Switch"
    await runTest("WIDE_BROADCAST (1,000 nodes)", (me) => {
        me.master_switch(1);
        for(let i=0; i<1000; i++) {
            me.sensors[i].val(10);
            me.sensors[i]["="]("alert", "val * master_switch");
        }
    }, "master_switch", "sensors.999.alert");

    // ESCENARIO 3: EL CÁLCULO FINANCIERO (Lógica Real)
    // Simulamos un dataset de 5,000 transacciones con impuestos
    await runTest("FINANCIAL_DATASET (5,000 tx)", (me) => {
        me.tax_rate(0.16);
        for(let i=0; i<5000; i++) {
            me.tx[i].amount(100);
            me.tx[i]["="]("total", "amount + (amount * tax_rate)");
        }
    }, "tax_rate", "tx.4999.total");

    console.log("\n========================================================");
}

startLab().catch(console.error);
