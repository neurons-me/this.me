---
layout: gui-doc
title: .me
crumb: .me
description: A Cryptographic Identity.
image: https://suign.github.io/assets/imgs/me.png
---

<div class="me-landing-hero" markdown="0">
{% include interactive-hero.html %}
</div>

<div class="me-demo-cards" markdown="0">
<a class="card" href="https://neurons-me.github.io/Get.me.started.html"><span class="card-title">⚡ Get .me started</span><span class="card-desc">Clone the repo, pick a runtime: 🔷 TypeScript, 🦀 Rust, 🐍 Python.</span><code class="card-code">me[&quot;@&quot;](&quot;abella&quot;) // you are Abella</code></a>
<a class="card" href="https://neurons-me.github.io/.me/docs/Social-Graph.html"><span class="card-title">𓀠 Social Graph</span><span class="card-desc">Identity, trust and relationships.</span><code class="card-code">me(&quot;friends[isAdult == true].name&quot;)</code></a>
<a class="card" href="https://neurons-me.github.io/.me/docs/Splitting-your-Bill.html"><span class="card-title">💳 Splitting your Bill</span><span class="card-desc">Shared expenses, split automatically, settled.</span><code class="card-code">me.wallets.vancouver[&quot;=&quot;](&quot;balance_ana&quot;, &quot;paid.ana - per_person&quot;)</code></a>
<a class="card" href="https://neurons-me.github.io/.me/docs/Running-your-CoffeeShops.html"><span class="card-title">☕ CoffeeShops</span><span class="card-desc">Inventory and operations as a graph.</span><code class="card-code">me.shops[&quot;[i]&quot;].menu[&quot;=&quot;](&quot;isPremium&quot;, &quot;breakfastDeal &gt; 6.5&quot;)</code></a>
<a class="card" href="https://neurons-me.github.io/robots/"><span class="card-title">🤖 Robots That Understand Context</span><span class="card-desc">Same object, different meaning.</span><code class="card-code">me.robots.surgeon.target[&quot;-&gt;&quot;](&quot;objects.canister7&quot;)</code></a>
<a class="card" href="https://neurons-me.github.io/smart-cities/"><span class="card-title">🏙️ Smart City</span><span class="card-desc">A city reacting as one connected graph.</span><code class="card-code">me.as(null)(&quot;security.alertLevel&quot;)</code></a>
<a class="card" href="https://neurons-me.github.io/.me/docs/Hemisphere-Scale.html"><span class="card-title">🌐 Hemisphere Scale</span><span class="card-desc">1 million sensors. One flips. Only 6 recompute.</span><code class="card-code">me.explain(&quot;services.generatorMode&quot;).meta.k // 6</code></a>
<a class="card" href="https://neurons-me.github.io/.me/docs/Extreme-Fan-Out.html"><span class="card-title">⚡ Extreme Fan-Out</span><span class="card-desc">One write updates 100k dependents.</span><code class="card-code">me.explain(&quot;dep[100000].out&quot;).meta.k // 100000</code></a>
</div>
<p class="me-demo-all"><a href="https://github.com/neurons-me/.me/tree/main/Typescript/tests/Demos">⌬ ⊚ View all demos →</a></p>

<style>.readme-demos{display:none} .me-demo-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin:0 0 12px} .me-demo-cards a.card{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid rgba(127,127,127,.35);border-radius:12px;text-decoration:none;color:inherit} .me-demo-cards .card-title{font-weight:700} .me-demo-cards .card-desc{font-size:.88rem;opacity:.8} .me-demo-cards .card-code{font-size:.78rem;overflow-x:auto;white-space:nowrap}</style>

{% include_relative README.md %}
