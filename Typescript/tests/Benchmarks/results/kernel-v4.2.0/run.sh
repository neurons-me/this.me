#!/bin/bash
export PATH=/tmp/node22/bin:$PATH
O=/workspace/_bench/out
B5="benchmark.5.sustained-mutation.test benchmark.6.fanout-sensitivity.test benchmark.7.cold-warm-profiles.test benchmark.8.explain-overhead.test benchmark.9.secret-scope-impact.test benchmark.10.push-vs-pull.test benchmark.11.secret-push-vs-pull.test"
for r in 1 2 3 4 5; do
  echo "round $r start $(date +%T)"
  mkdir -p $O/b420/r$r $O/b409fix/r$r $O/b391/r$r
  (cd /workspace/_bench/b420/Typescript && node tests/fire.test.ts > $O/b420/r$r/fire.log 2>&1); echo " b420 fire $? $(date +%T)"
  for b in $B5; do (cd /workspace/_bench/b409fix/Typescript && node tests/Benchmarks/$b.ts > $O/b409fix/r$r/$b.log 2>&1); done; echo " b409fix $(date +%T)"
  (cd /workspace/_bench/b391/Typescript && node tests/fire.test.ts > $O/b391/r$r/fire.log 2>&1); echo " b391 fire $? $(date +%T)"
done
echo DONE $(date +%T)
