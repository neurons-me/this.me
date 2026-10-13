# S1 fan-out skew: scale-10 results (this.me@4.2.1, kernel unchanged)

Run: this.me@4.2.1 (dist/me.es.js sha256 0bd2cc60d15d…), Node v22.23.3, Intel(R) Xeon(R) Processor × 8, 16 GiB, Linux 6.12.94+ x64; count aggregates: explicit; first run 2026-10-13T04:31:47.837Z

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
| vig-original | 3604 (3604–3604) | 3809 | 0.45 / 1.08 / 1.12 | 0.18 / 0.48 / 4.19 | 116.5 / 123.5 / 131.2 | 114.4 | 7932× / 19946× / 31× |
| zipf-a0 | 4114 (3856–4261) | 3844 | 0.41 / 0.99 / 1.93 | 0.18 / 0.58 / 1.62 | 116.7 / 130.7 / 186.5 | 115.6 | 10128× / 23141× / 35× |
| zipf-a0.5 | 3784 (3750–4267) | 3840 | 0.45 / 1.51 / 1.97 | 0.19 / 0.58 / 2.93 | 113.0 / 126.6 / 359.0 | 114.6 | 8336× / 19692× / 33× |
| zipf-a1 | 3654 (3476–4071) | 3644 | 0.30 / 1.28 / 2.14 | 0.17 / 0.52 / 1.33 | 112.1 / 127.5 / 352.4 | 114.1 | 12059× / 21481× / 33× |
| zipf-a1.5 | 3910 (3810–4211) | 3703 | 0.19 / 1.11 / 2.10 | 0.18 / 0.49 / 1.74 | 113.4 / 129.7 / 545.6 | 114.7 | 21122× / 22099× / 34× |
| zipf-a2 | 3875 (3807–4033) | 3853 | 0.14 / 0.72 / 1.58 | 0.20 / 0.59 / 1.97 | 117.4 / 133.6 / 770.3 | 114.9 | 27942× / 19349× / 33× |
| hub-1x50 | 3789 (3592–4200) | 3821 | 0.23 / 0.60 / 1.20 | 0.18 / 0.54 / 1.77 | 117.2 / 127.6 / 682.7 | 120.8 | 16220× / 21156× / 32× |
| hub-3x75 | 3840 (3806–4128) | 3753 | 0.18 / 0.47 / 1.36 | 0.18 / 0.55 / 2.07 | 112.7 / 124.9 / 413.4 | 120.0 | 20906× / 21249× / 34× |

## 4. Fan-out census (targeted writes on a fresh instance; pooled over seeds)

- service: one write per service that flips `active` (k = 1 + trips of that service).
- trip delete: `me["-"]` on the 10 widest + 40 seeded-random trips (k = stop_times of that trip).
- slot: `gtfs.idx` membership slot 0→1 on the 5 widest and 5 median trips (k = 1; the `stopTimeCount` sum has one term per stop_time of the trip).

| variant | service k p50 / p95 / max | service apply ms p50 / max | fit apply ≈ a + b·k (service): b µs/k, r | trip-delete k p50 / max | trip-delete apply ms p50 / max | slot: widest sum width → apply ms |
|---|---|---|---|---|---|---|
| vig-original | 27 / 27 / 27 | 0.81 / 1.99 | –, – | 18 / 19 | 109.8 / 127.2 | 19 → 0.17 (median trip 18 → 0.13) |
| zipf-a0 | 27 / 27 / 27 | 0.99 / 4.47 | –, – | 18 / 19 | 112.0 / 134.9 | 19 → 0.22 (median trip 18 → 0.12) |
| zipf-a0.5 | 21 / 60 / 103 | 0.74 / 4.39 | 33.2, 0.95 | 15 / 335 | 108.4 / 205.9 | 335 → 2.45 (median trip 13 → 0.10) |
| zipf-a1 | 12.5 / 97 / 290 | 0.44 / 9.99 | 33.1, 0.99 | 6 / 3051 | 112.0 / 271.5 | 3051 → 19.16 (median trip 5 → 0.09) |
| zipf-a1.5 | 5 / 108 / 559 | 0.24 / 22.82 | 37.1, 0.99 | 1 / 9246 | 112.7 / 556.8 | 9246 → 64.65 (median trip 1 → 0.03) |
| zipf-a2 | 2 / 90 / 801 | 0.13 / 30.34 | 36.1, 1.00 | 2 / 14378 | 110.0 / 841.7 | 14378 → 95.30 (median trip 1 → 0.02) |
| hub-1x50 | 14 / 15 / 651 | 0.48 / 22.24 | 32.9, 1.00 | 9 / 11820 | 111.8 / 719.5 | 11820 → 83.83 (median trip 9 → 0.07) |
| hub-3x75 | 8 / 326 / 326 | 0.32 / 13.04 | 34.7, 0.99 | 5 / 5910 | 109.4 / 425.8 | 5910 → 39.60 (median trip 5 → 0.06) |

### Apply time by k (or sum width) bucket, pooled over all variants and seeds

Medians are the robust numbers here; the max column contains the stalls discussed in the README.

**census service flips, bucket = k**

| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |
|---|---:|---:|---:|---:|---:|
| 1–30 | 992 | 0.46 | 1.08 | 4.5 | 2636 |
| 31–100 | 72 | 1.58 | 3.74 | 4.3 | 4422 |
| 101–300 | 18 | 5.60 | 10.10 | 10.7 | 11576 |
| 301–1000 | 18 | 16.33 | 28.51 | 30.3 | 26777 |

**census trip DELETE, bucket = k**

| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |
|---|---:|---:|---:|---:|---:|
| 1–30 | 944 | 109.63 | 122.03 | 156.0 | 1543 |
| 31–100 | 18 | 109.68 | 120.75 | 121.4 | 6875 |
| 101–300 | 48 | 120.00 | 141.37 | 205.9 | 18801 |
| 301–1000 | 48 | 140.28 | 161.47 | 183.9 | 58113 |
| 1001–3000 | 15 | 189.36 | 206.15 | 206.7 | 188304 |
| 3001–10000 | 21 | 397.21 | 544.28 | 556.8 | 662966 |
| 10001– | 6 | 762.28 | 836.03 | 841.7 | 1534094 |

**idx slot 0→1 (k = 1), bucket = sum width**

| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |
|---|---:|---:|---:|---:|---:|
| 1–30 | 148 | 0.07 | 0.14 | 0.2 | 3952 |
| 101–300 | 12 | 1.14 | 1.54 | 1.6 | 70957 |
| 301–1000 | 18 | 4.75 | 6.47 | 6.8 | 257166 |
| 1001–3000 | 15 | 10.15 | 12.16 | 12.4 | 609956 |
| 3001–10000 | 21 | 39.23 | 64.65 | 65.7 | 2129124 |
| 10001– | 6 | 89.56 | 98.01 | 98.1 | 4938560 |


Pooled fits over all variants and seeds: service apply ≈ 0.046 ms + 35.16 µs·k (r = 0.991, n = 1100); trip delete apply ≈ 110.7 ms + 49.46 µs·k (r = 0.992, n = 1100); slot flip apply ≈ 0.031 ms + 6.810 µs·width (r = 0.999, n = 220).

## 5. Explanation size: JSON bytes of `explain(probe)` right after the write

| variant | seed0 all p50 / p95 / max | UPDATE service max | DELETE trip max | census service max | census trip-delete max | slot widest | explain() ms max |
|---|---|---:|---:|---:|---:|---:|---:|
| vig-original | 2781 / 3693 / 32127 | 3556 | 3003 | 3579 | 3001 | 6822 | 2.2 |
| zipf-a0 | 2741 / 3693 / 32127 | 3589 | 2963 | 3597 | 2957 | 6726 | 2.6 |
| zipf-a0.5 | 2673 / 4306 / 36658 | 5017 | 36658 | 7641 | 41445 | 119153 | 5.3 |
| zipf-a1 | 2588 / 3950 / 335337 | 6083 | 335337 | 18259 | 378154 | 1096799 | 46.9 |
| zipf-a1.5 | 2673 / 3949 / 1019547 | 6025 | 1019547 | 33239 | 1149082 | 3333844 | 135.5 |
| zipf-a2 | 2673 / 3949 / 1595106 | 4853 | 1595106 | 46839 | 1796515 | 5209030 | 262.5 |
| hub-1x50 | 2346 / 3693 / 1307450 | 2919 | 1307450 | 38411 | 1473081 | 4272650 | 199.6 |
| hub-3x75 | 2346 / 3693 / 651085 | 2505 | 651085 | 20405 | 745821 | 2129124 | 100.5 |

Pooled: explain bytes ≈ 1914 + 56.0·k for service flips (r = 1.000); slot flips (k = 1) ≈ 6072 + 377.8·width (r = 0.998).

Raw: `runs/scale10-<variant>-s<seed>.json`, `scale10-skew-sweep.tsv` (one line per measured mutation), `scale10-skew-sweep.json` (aggregates).
