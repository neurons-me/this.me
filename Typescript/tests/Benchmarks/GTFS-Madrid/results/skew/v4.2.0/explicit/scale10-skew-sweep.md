# S1 fan-out skew: scale-10 results (this.me@4.2.0, kernel unchanged)

Run: this.me@4.2.0 (dist/me.es.js sha256 8cc94d5273b0…), Node v22.23.3, Intel(R) Xeon(R) Processor × 8, 16 GiB, Linux 6.12.94+ x64; count aggregates: explicit; first run 2026-10-10T23:27:20.964Z

Runs: 22 (variants × seeds). Rows per table are fixed ({"routes":130,"trips":1300,"stopTimes":23640,"services":50}). Only `trips.service_id` and `stop_times.trip_id` were reassigned.

## 1. Fan-out per variant (base snapshot; identical for every seed, only the parent identities change)

| variant | trips/service min / median / p95 / max | services with 0 trips | stop_times/trip min / median / p95 / max | trips with 0 stop_times | top trip share |
|---|---|---:|---|---:|---:|
| Madrid seed (original, 5 services, 130 trips) | 2 / 32 / 32 / 32 | 0 | 2 / 20 / 33 / 33 | 0 | 1.4% |
| vig-original | 26 / 26 / 26 / 26 | 0 | 18 / 18 / 19 / 19 | 0 | 0.1% |
| zipf-a0 | 26 / 26 / 26 / 26 | 0 | 18 / 18 / 19 / 19 | 0 | 0.1% |
| zipf-a0.5 | 14 / 20 / 55.4 / 102 | 0 | 9 / 13 / 41 / 335 | 0 | 1.4% |
| zipf-a1 | 6 / 11.5 / 85.2 / 289 | 0 | 2 / 5 / 46.0 / 3051 | 0 | 12.9% |
| zipf-a1.5 | 1 / 4 / 90.3 / 558 | 0 | 0 / 1 / 17.0 / 9246 | 516 | 39.1% |
| zipf-a2 | 0 / 1 / 71.4 / 800 | 10 | 0 / 0 / 3.0 / 14378 | 1091 | 60.8% |
| hub-1x50 | 13 / 13 / 14 / 650 | 0 | 9 / 9 / 10 / 11820 | 0 | 50.0% |
| hub-3x75 | 6 / 7 / 181.9 / 325 | 0 | 4 / 5 / 5 / 5910 | 0 | 25.0% |

## 2. k for the base→seed0 workload (same plan code as sweep-seed0.ts; pooled over seeds)

| variant | N measured (per seed) | k mean | k p50 | k p95 | k max | max k per seed | UPDATE service k mean / p95 / max | DELETE trip k mean / p95 / max | DELETE route k max | CREATE k max |
|---|---|---:|---:|---:|---:|---|---|---|---:|---:|
| vig-original | 1304 | 4.33 | 1 | 18 | 27 | 27 | 9.7 / 27 / 27 | 18.2 / 19 / 19 | 10 | 1 |
| zipf-a0 | 1304, 1304, 1304 | 4.33 | 1 | 18 | 27 | 27, 27, 27 | 9.7 / 27 / 27 | 18.2 / 19 / 19 | 10 | 1 |
| zipf-a0.5 | 1304, 1304, 1304 | 4.33 | 1 | 18 | 335 | 126, 335, 126 | 9.4 / 37 / 52 | 18.2 / 43.0 / 335 | 10 | 1 |
| zipf-a1 | 1304, 1304, 1304 | 4.54 | 1 | 10 | 3051 | 436, 3051, 436 | 8.0 / 37 / 73 | 19.8 / 50.1 / 3051 | 10 | 1 |
| zipf-a1.5 | 1213, 1206, 1218 | 5.33 | 1 | 4 | 9246 | 499, 9246, 499 | 5.6 / 26 / 71 | 38.9 / 44.2 / 9246 | 10 | 1 |
| zipf-a2 | 1119, 1115, 1116 | 6.30 | 1 | 1 | 14378 | 294, 14378, 294 | 3.4 / 13 / 51 | 172.9 / 235.3 / 14378 | 10 | 1 |
| hub-1x50 | 1304, 1304, 1304 | 5.68 | 1 | 9 | 11820 | 15, 11820, 15 | 5.5 / 15 / 15 | 27.0 / 10 / 11820 | 10 | 1 |
| hub-3x75 | 1304, 1304, 1304 | 3.33 | 1 | 5 | 5910 | 10, 5910, 10 | 3.3 / 8 / 8 | 13.5 / 5 / 5910 | 10 | 1 |

## 3. Time: per-mutation apply (eager wave included) vs full rebuild

Rebuild = fresh `new ME()` + load + wire aggregates (2nd load in the same process, after the seed0 workload) + one read of every derived value; the ratio column uses the median rebuild. Apply = `mutationApplyMs` from measureOne (the eager recompute runs inside the write). ms, pooled over seeds.

| variant | rebuild ms median (min–max over seeds) | cold first load ms median | UPDATE service apply p50 / p95 / max | CREATE apply p50 / p95 / max | DELETE trip apply p50 / p95 / max | DELETE route apply p50 | rebuild ÷ apply p50 (UPDATE / CREATE / DELETE trip) |
|---|---:|---:|---|---|---|---:|---|
| vig-original | 5784 (5784–5784) | 5194 | 0.53 / 1.25 / 2.80 | 0.21 / 0.78 / 2.00 | 140.3 / 168.9 / 186.8 | 133.4 | 10932× / 27016× / 41× |
| zipf-a0 | 5139 (4866–5549) | 4655 | 0.64 / 1.83 / 2.73 | 0.22 / 0.86 / 15.60 | 140.7 / 190.8 / 434.7 | 139.6 | 8011× / 22941× / 37× |
| zipf-a0.5 | 4664 (4653–6747) | 4999 | 0.68 / 2.40 / 3.27 | 0.29 / 0.95 / 6.71 | 142.9 / 193.1 / 414.7 | 145.7 | 6844× / 16357× / 33× |
| zipf-a1 | 5163 (5077–5187) | 5130 | 0.48 / 1.99 / 4.23 | 0.25 / 0.74 / 30.94 | 139.6 / 179.4 / 340.7 | 143.5 | 10849× / 20761× / 37× |
| zipf-a1.5 | 4795 (4530–5215) | 4778 | 0.26 / 1.48 / 4.25 | 0.22 / 0.73 / 2.74 | 135.3 / 162.0 / 860.5 | 136.6 | 18367× / 21597× / 35× |
| zipf-a2 | 4974 (4817–5307) | 4812 | 0.20 / 0.91 / 3.03 | 0.25 / 0.78 / 2.61 | 145.9 / 192.8 / 1211.8 | 146.6 | 24578× / 20003× / 34× |
| hub-1x50 | 4759 (4659–5779) | 5156 | 0.32 / 0.95 / 3.00 | 0.22 / 0.73 / 2.52 | 137.4 / 177.0 / 901.0 | 136.8 | 14713× / 21696× / 35× |
| hub-3x75 | 4566 (4439–4715) | 4854 | 0.23 / 0.68 / 1.58 | 0.21 / 0.78 / 2.41 | 131.9 / 172.6 / 499.6 | 133.0 | 20184× / 21771× / 35× |

## 4. Fan-out census (targeted writes on a fresh instance; pooled over seeds)

- service: one write per service that flips `active` (k = 1 + trips of that service).
- trip delete: `me["-"]` on the 10 widest + 40 seeded-random trips (k = stop_times of that trip).
- slot: `gtfs.idx` membership slot 0→1 on the 5 widest and 5 median trips (k = 1; the `stopTimeCount` sum has one term per stop_time of the trip).

| variant | service k p50 / p95 / max | service apply ms p50 / max | fit apply ≈ a + b·k (service): b µs/k, r | trip-delete k p50 / max | trip-delete apply ms p50 / max | slot: widest sum width → apply ms |
|---|---|---|---|---|---|---|
| vig-original | 27 / 27 / 27 | 1.18 / 3.27 | –, – | 18 / 19 | 137.6 / 174.2 | 19 → 0.22 (median trip 18 → 0.15) |
| zipf-a0 | 27 / 27 / 27 | 1.23 / 3.27 | –, – | 18 / 19 | 130.2 / 482.9 | 19 → 0.36 (median trip 18 → 0.29) |
| zipf-a0.5 | 21 / 60 / 103 | 1.42 / 8.00 | 53.8, 0.79 | 15 / 335 | 136.1 / 255.6 | 335 → 3.68 (median trip 13 → 0.12) |
| zipf-a1 | 12.5 / 97 / 290 | 0.63 / 15.43 | 48.0, 0.98 | 6 / 3051 | 135.0 / 336.2 | 3051 → 33.41 (median trip 5 → 0.08) |
| zipf-a1.5 | 5 / 108 / 559 | 0.35 / 42.01 | 56.5, 0.97 | 1 / 9246 | 130.4 / 849.4 | 9246 → 91.23 (median trip 1 → 0.04) |
| zipf-a2 | 2 / 90 / 801 | 0.19 / 51.94 | 52.6, 0.98 | 2 / 14378 | 137.6 / 1166.5 | 14378 → 151.19 (median trip 1 → 0.03) |
| hub-1x50 | 14 / 15 / 651 | 0.65 / 32.63 | 47.7, 1.00 | 9 / 11820 | 129.0 / 955.1 | 11820 → 131.43 (median trip 9 → 0.10) |
| hub-3x75 | 8 / 326 / 326 | 0.41 / 23.65 | 52.8, 0.98 | 5 / 5910 | 128.1 / 655.3 | 5910 → 74.05 (median trip 5 → 0.14) |

### Apply time by k (or sum width) bucket, pooled over all variants and seeds

Medians are the robust numbers here; the max column contains the stalls discussed in the README.

**census service flips, bucket = k**

| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |
|---|---:|---:|---:|---:|---:|
| 1–30 | 992 | 0.64 | 1.79 | 4.8 | 2636 |
| 31–100 | 72 | 2.41 | 5.15 | 6.5 | 4422 |
| 101–300 | 18 | 8.22 | 14.87 | 15.4 | 11576 |
| 301–1000 | 18 | 24.73 | 43.50 | 51.9 | 26777 |

**census trip DELETE, bucket = k**

| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |
|---|---:|---:|---:|---:|---:|
| 1–30 | 944 | 130.25 | 163.81 | 482.9 | 1543 |
| 31–100 | 18 | 138.26 | 159.20 | 171.3 | 6875 |
| 101–300 | 48 | 148.59 | 208.48 | 241.4 | 18801 |
| 301–1000 | 48 | 172.44 | 202.51 | 246.3 | 58113 |
| 1001–3000 | 15 | 231.27 | 266.96 | 310.6 | 188304 |
| 3001–10000 | 21 | 498.71 | 722.62 | 849.4 | 662966 |
| 10001– | 6 | 1003.62 | 1141.30 | 1166.5 | 1534094 |

**idx slot 0→1 (k = 1), bucket = sum width**

| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |
|---|---:|---:|---:|---:|---:|
| 1–30 | 148 | 0.10 | 0.28 | 0.4 | 3952 |
| 101–300 | 12 | 2.22 | 4.04 | 4.9 | 70957 |
| 301–1000 | 18 | 7.60 | 9.87 | 10.0 | 257166 |
| 1001–3000 | 15 | 16.96 | 20.75 | 22.0 | 609956 |
| 3001–10000 | 21 | 74.05 | 111.83 | 112.5 | 2129124 |
| 10001– | 6 | 143.73 | 179.09 | 185.8 | 4938560 |


Pooled fits over all variants and seeds: service apply ≈ 0.051 ms + 52.02 µs·k (r = 0.979, n = 1100); trip delete apply ≈ 135.1 ms + 66.75 µs·k (r = 0.973, n = 1100); slot flip apply ≈ 0.298 ms + 12.015 µs·width (r = 0.985, n = 220).

## 5. Explanation size: JSON bytes of `explain(probe)` right after the write

| variant | seed0 all p50 / p95 / max | UPDATE service max | DELETE trip max | census service max | census trip-delete max | slot widest | explain() ms max |
|---|---|---:|---:|---:|---:|---:|---:|
| vig-original | 2781 / 3693 / 32127 | 3556 | 3003 | 3579 | 3001 | 6822 | 2.7 |
| zipf-a0 | 2741 / 3693 / 32127 | 3589 | 2963 | 3597 | 2957 | 6726 | 3.6 |
| zipf-a0.5 | 2673 / 4306 / 36658 | 5017 | 36658 | 7641 | 41445 | 119153 | 10.0 |
| zipf-a1 | 2588 / 3950 / 335337 | 6083 | 335337 | 18259 | 378154 | 1096799 | 70.3 |
| zipf-a1.5 | 2673 / 3949 / 1019547 | 6025 | 1019547 | 33239 | 1149082 | 3333844 | 209.5 |
| zipf-a2 | 2673 / 3949 / 1595106 | 4853 | 1595106 | 46839 | 1796515 | 5209030 | 417.2 |
| hub-1x50 | 2346 / 3693 / 1307450 | 2919 | 1307450 | 38411 | 1473081 | 4272650 | 232.3 |
| hub-3x75 | 2346 / 3693 / 651085 | 2505 | 651085 | 20405 | 745821 | 2129124 | 201.6 |

Pooled: explain bytes ≈ 1914 + 56.0·k for service flips (r = 1.000); slot flips (k = 1) ≈ 6072 + 377.8·width (r = 0.998).

Raw: `runs/scale10-<variant>-s<seed>.json`, `scale10-skew-sweep.tsv` (one line per measured mutation), `scale10-skew-sweep.json` (aggregates).
