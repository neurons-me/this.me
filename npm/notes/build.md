→ This means you’ll get all three builds (ESM, CommonJS, and UMD), perfect for NPM + CDN usage.
Esto indica **qué archivos exporta tu paquete cuando alguien lo importa**, y **de dónde salen los builds**.
Cada línea apunta a un *bundle compilado*, no al código fuente original.
- main → versión **CommonJS (Node.js)** → dist/index.cjs.js
- module → versión **ESM (import/export moderno)** → dist/index.es.js
- browser → versión **UMD (para** **<script>** **del navegador)** → dist/index.umd.js
- exports → define explícitamente cómo se resuelven los imports:
  - import this.me usa index.es.js
  - require("this.me") usa index.cjs.js
  
Así que, en resumen:
	•	main → CommonJS (require)
	•	module → ES Module (import)
	•	browser → UMD (para <script> en navegador)
	•	exports → garantiza compatibilidad con entornos modernos de Node y bundlers.


