# S1 fan-out skew: scale-10 results (this.me@4.1.0, kernel unchanged)

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
| vig-original | 4955 (4955–4955) | 32088 | 0.65 / 2.23 / 2.56 | 0.29 / 1.16 / 11.80 | 180.1 / 215.5 / 446.0 | 214.3 | 7648× / 17358× / 28× |
| zipf-a0 | 5348 (4959–5410) | 5050 | 0.65 / 2.07 / 17.22 | 0.29 / 0.90 / 6.10 | 160.3 / 206.5 / 16266.0 | 165.2 | 8169× / 18572× / 33× |
| zipf-a0.5 | 5605 (5098–10335) | 5222 | 0.64 / 2.34 / 16.00 | 0.26 / 0.88 / 11.52 | 161.2 / 233.9 / 10869.0 | 163.8 | 8725× / 21202× / 35× |
| zipf-a1 | 5274 (4820–5403) | 5227 | 0.52 / 6.76 / 14.80 | 0.27 / 1.24 / 34.93 | 158.2 / 196.1 / 465.2 | 162.1 | 10120× / 19350× / 33× |
| zipf-a1.5 | 5791 (5478–5849) | 5184 | 0.34 / 2.76 / 13.57 | 0.31 / 1.83 / 37.65 | 164.4 / 195.6 / 1029.6 | 168.1 | 17042× / 18888× / 35× |
| zipf-a2 | 5305 (5001–6252) | 5534 | 0.17 / 1.36 / 3.19 | 0.32 / 1.44 / 20.71 | 193.5 / 233.2 / 1147.8 | 180.1 | 30557× / 16480× / 27× |
| hub-1x50 | 5841 (4839–5983) | 6740 | 0.39 / 1.25 / 2.43 | 0.32 / 0.99 / 23.99 | 169.1 / 213.3 / 1084.6 | 187.9 | 15041× / 18131× / 35× |
| hub-3x75 | 5758 (5251–7675) | 5556 | 0.31 / 0.74 / 2.55 | 0.32 / 0.80 / 14.79 | 163.9 / 191.0 / 729.9 | 170.7 | 18368× / 17772× / 35× |

## 4. Fan-out census (targeted writes on a fresh instance; pooled over seeds)

- service: one write per service that flips `active` (k = 1 + trips of that service).
- trip delete: `me["-"]` on the 10 widest + 40 seeded-random trips (k = stop_times of that trip).
- slot: `gtfs.idx` membership slot 0→1 on the 5 widest and 5 median trips (k = 1; the `stopTimeCount` sum has one term per stop_time of the trip).

| variant | service k p50 / p95 / max | service apply ms p50 / max | fit apply ≈ a + b·k (service): b µs/k, r | trip-delete k p50 / max | trip-delete apply ms p50 / max | slot: widest sum width → apply ms |
|---|---|---|---|---|---|---|
| vig-original | 27 / 27 / 27 | 1.24 / 3.30 | –, – | 18 / 19 | 149.8 / 179.2 | 19 → 0.21 (median trip 18 → 0.15) |
| zipf-a0 | 27 / 27 / 27 | 1.48 / 5.07 | –, – | 18 / 19 | 149.6 / 185.8 | 19 → 0.25 (median trip 18 → 0.14) |
| zipf-a0.5 | 21 / 60 / 103 | 1.29 / 6.89 | 52.5, 0.80 | 15 / 335 | 150.9 / 253.2 | 335 → 3.36 (median trip 13 → 0.13) |
| zipf-a1 | 12.5 / 97 / 290 | 0.70 / 16.82 | 50.8, 0.98 | 6 / 3051 | 155.0 / 477.1 | 3051 → 34.66 (median trip 5 → 0.07) |
| zipf-a1.5 | 5 / 108 / 559 | 0.37 / 42.48 | 60.9, 0.98 | 1 / 9246 | 167.2 / 1373.0 | 9246 → 113.20 (median trip 1 → 0.03) |
| zipf-a2 | 2 / 90 / 801 | 0.18 / 46.64 | 53.8, 1.00 | 2 / 14378 | 161.6 / 1543.1 | 14378 → 183.17 (median trip 1 → 0.02) |
| hub-1x50 | 14 / 15 / 651 | 0.81 / 41.64 | 56.5, 0.99 | 9 / 11820 | 164.4 / 8289.4 | 11820 → 144.58 (median trip 9 → 0.16) |
| hub-3x75 | 8 / 326 / 326 | 0.49 / 58.76 | 71.4, 0.86 | 5 / 5910 | 178.7 / 2139.1 | 5910 → 167.70 (median trip 5 → 1.04) |

### Apply time by k (or sum width) bucket, pooled over all variants and seeds

Medians are the robust numbers here; the max column contains the stalls discussed in the README.

**census service flips, bucket = k**

| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |
|---|---:|---:|---:|---:|---:|
| 1–30 | 992 | 0.73 | 1.71 | 6.9 | 2456 |
| 31–100 | 72 | 2.41 | 4.86 | 6.4 | 4242 |
| 101–300 | 18 | 8.72 | 16.39 | 16.8 | 11396 |
| 301–1000 | 18 | 30.18 | 48.46 | 58.8 | 26597 |

**census trip DELETE, bucket = k**

| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |
|---|---:|---:|---:|---:|---:|
| 1–30 | 944 | 156.26 | 250.56 | 2139.1 | 1524 |
| 31–100 | 18 | 152.69 | 180.46 | 203.3 | 6856 |
| 101–300 | 48 | 167.96 | 210.26 | 225.2 | 18782 |
| 301–1000 | 48 | 192.02 | 240.43 | 253.2 | 58094 |
| 1001–3000 | 15 | 283.98 | 348.83 | 361.7 | 188285 |
| 3001–10000 | 21 | 567.28 | 1830.87 | 2122.3 | 662947 |
| 10001– | 6 | 1192.54 | 6602.80 | 8289.4 | 1534075 |

**idx slot 0→1 (k = 1), bucket = sum width**

| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |
|---|---:|---:|---:|---:|---:|
| 1–30 | 148 | 0.11 | 0.25 | 1.8 | 3772 |
| 101–300 | 12 | 2.12 | 4.08 | 5.6 | 67357 |
| 301–1000 | 18 | 8.91 | 15.59 | 25.9 | 243436 |
| 1001–3000 | 15 | 18.36 | 27.12 | 27.7 | 579436 |
| 3001–10000 | 21 | 74.41 | 212.10 | 6028.8 | 2010924 |
| 10001– | 6 | 169.49 | 182.14 | 183.2 | 4676580 |


Pooled fits over all variants and seeds: service apply ≈ 0.027 ms + 58.38 µs·k (r = 0.946, n = 1100); trip delete apply ≈ 167.0 ms + 143.79 µs·k (r = 0.616, n = 1100); slot flip apply ≈ 7.921 ms + 33.052 µs·width (r = 0.214, n = 220).

## 5. Explanation size: JSON bytes of `explain(probe)` right after the write

| variant | seed0 all p50 / p95 / max | UPDATE service max | DELETE trip max | census service max | census trip-delete max | slot widest | explain() ms max |
|---|---|---:|---:|---:|---:|---:|---:|
| vig-original | 2738 / 3433 / 29087 | 3376 | 2984 | 3399 | 2982 | 6442 | 15.3 |
| zipf-a0 | 2722 / 3433 / 29087 | 3409 | 2944 | 3417 | 2938 | 6346 | 4.1 |
| zipf-a0.5 | 2533 / 4287 / 36639 | 4837 | 36639 | 7461 | 41426 | 112453 | 9.0 |
| zipf-a1 | 2467 / 3797 / 335318 | 5903 | 335318 | 18079 | 378135 | 1035779 | 68.2 |
| zipf-a1.5 | 2533 / 3669 / 1019528 | 5845 | 1019528 | 33059 | 1149063 | 3148924 | 224.8 |
| zipf-a2 | 2533 / 3669 / 1595087 | 4673 | 1595087 | 46659 | 1796496 | 4921470 | 340.9 |
| hub-1x50 | 2226 / 3433 / 1307431 | 2739 | 1307431 | 38231 | 1473062 | 4036250 | 350.1 |
| hub-3x75 | 2226 / 3433 / 651066 | 2325 | 651066 | 20225 | 745802 | 2010924 | 1429.2 |

Pooled: explain bytes ≈ 1734 + 56.0·k for service flips (r = 1.000); slot flips (k = 1) ≈ 6072 + 357.8·width (r = 0.998).

Raw: `runs/scale10-<variant>-s<seed>.json`, `scale10-skew-sweep.tsv` (one line per measured mutation), `scale10-skew-sweep.json` (aggregates).
