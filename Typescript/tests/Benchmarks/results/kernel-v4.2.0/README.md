# Kernel benchmarks 1–11 and the fire test on this.me 4.2.0 (2026-10-10)

Machine: shared Linux VM, Intel Xeon (8 vCPU, model not exposed), 16 GiB, Node 22.23.3. Other processes were running; medians over 5 rounds absorb most of that.

Builds, each compiled from its own commit with `vite build` (same benchmark files in all three; `git diff` between the commits is empty for `tests/Benchmarks/benchmark*.ts` and `tests/fire.test.ts`):

| label | commit | what it is |
|---|---|---|
| `b420` | `v4.2.0` | this.me 4.2.0; `dist/` is byte-identical to the npm package (`me.es.js` sha256 `8cc94d52…`) |
| `b409fix` | `2a173b7` | the build with the reference fix used for the published 5–11 numbers (2026-09-26), before the 4.1.0 release |
| `b391` | `1bc5227` | 3.9.1, the build of the published 1–4 numbers and fire test (2026-06-08) |

Method (`run.sh`): 5 rounds; in each round `node tests/fire.test.ts` on 4.2.0 (phases, suites, benchmarks 1–11, contracts), then benchmarks 5–11 one file at a time on `b409fix`, then `node tests/fire.test.ts` on 3.9.1. Each value is the median over the 5 rounds (`parse.py` → `medians.json`, with min and max). Compare 4.2.0 with 3.9.1 for 1–4 and with `b409fix` for 5–11; 3.9.1's own 5–11 have the reference-resolution bug and recompute nothing.

`run.sh` is the script exactly as run (its paths are the machine's worktrees). Logs: `logs/<build>/r<round>/`.
