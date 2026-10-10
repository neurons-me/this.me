# base→seed0 sweep (propagation only)

Claim: dependency propagation — NOT RML materialization.

Run: this.me@4.1.0 (dist/me.es.js sha256 47cc8f9a9b5e…), Node v22.23.3, Intel(R) Xeon(R) Processor × 8, 16 GiB, Linux 6.12.94+ x64; count aggregates: explicit; 2026-10-10T23:32:41.128Z

CREATE semantics: `gtfs.idx` membership + parent `*Count` sum aggregates (slot 0→1).
Calendar: `active` derived from mon–sun + numeric start/end dates.

| metric | value |
|---|---|
| measured N | 151 |
| skipped | 0 |
| CREATE/UPDATE/DELETE | 111/7/33 |
| loadMs | 456.68 |
| k mean / p50 / p95 / max | 5.106 / 1 / 18.500 / 27 |
| k CREATE mean/p50/max | 1 / 1 / 1 (n=111) |
| k UPDATE mean/p50/max | 12.143 / 1 / 27 (n=7) |
| k DELETE mean/p50/max | 17.424 / 18 / 19 (n=33) |
| recomputeMs (probe read-back after the write) p50 / p95 / p99 | 0.006 / 0.153 / 0.215 |
| applyMs (the write, including its propagation wave) p50 / p95 / p99 | 0.260 / 9.446 / 10.849 |
| total recomputed / changed / unchanged | 771 / 767 / 4 |
| early-cutoff (unchanged/recomputed) | 0.0052 |

## Per-mutation (sorted by k desc)

| type | kind | id | field | k | recomputed | changed | unchanged | applyMs | recomputeMs | sourcePath |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| UPDATE | service | 00000000000000000003 | monday | 27 | 27 | 27 | 0 | 1.914 | 0.179 | gtfs.services.n3.monday |
| UPDATE | service | 00000000000000000003 | startDate | 27 | 27 | 27 | 0 | 0.949 | 0.135 | gtfs.services.n3.startDate |
| UPDATE | service | 00000000000000000003 | endDate | 27 | 27 | 27 | 0 | 0.855 | 0.110 | gtfs.services.n3.endDate |
| DELETE | trip | 00000000000000000033 |  | 19 | 19 | 19 | 0 | 9.273 | 0.106 | gtfs.trips.n51.routeId |
| DELETE | trip | 00000000000000000014 |  | 19 | 19 | 19 | 0 | 9.388 | 0.102 | gtfs.trips.n20.routeId |
| DELETE | trip | 0000000000000000002q |  | 19 | 19 | 19 | 0 | 9.605 | 0.113 | gtfs.trips.n168354133.routeId |
| DELETE | trip | 0000000000000000002d |  | 19 | 19 | 19 | 0 | 9.443 | 0.110 | gtfs.trips.n45.routeId |
| DELETE | trip | 0000000000000000000b |  | 19 | 19 | 19 | 0 | 8.849 | 0.114 | gtfs.trips.n11.routeId |
| DELETE | trip | 00000000000000000005 |  | 18 | 18 | 18 | 0 | 9.446 | 0.097 | gtfs.trips.n5.routeId |
| DELETE | trip | 0000000000000000003m |  | 18 | 18 | 18 | 0 | 10.602 | 0.099 | gtfs.trips.n302427990.routeId |
| DELETE | trip | 0000000000000000001g |  | 18 | 18 | 18 | 0 | 8.969 | 0.102 | gtfs.trips.n134254442.routeId |
| DELETE | trip | 0000000000000000003d |  | 18 | 18 | 18 | 0 | 8.895 | 0.182 | gtfs.trips.n61.routeId |
| DELETE | trip | 0000000000000000003b |  | 18 | 18 | 18 | 0 | 9.180 | 0.101 | gtfs.trips.n59.routeId |
| DELETE | trip | 0000000000000000001n |  | 18 | 18 | 18 | 0 | 9.389 | 0.100 | gtfs.trips.n251697775.routeId |
| DELETE | trip | 00000000000000000012 |  | 18 | 18 | 18 | 0 | 9.447 | 0.100 | gtfs.trips.n18.routeId |
| DELETE | trip | 0000000000000000002v |  | 18 | 18 | 18 | 0 | 9.267 | 0.098 | gtfs.trips.n151576514.routeId |
| DELETE | trip | 00000000000000000017 |  | 18 | 18 | 18 | 0 | 8.954 | 0.101 | gtfs.trips.n23.routeId |
| DELETE | trip | 0000000000000000000a |  | 18 | 18 | 18 | 0 | 9.318 | 0.103 | gtfs.trips.n10.routeId |
| DELETE | trip | 0000000000000000002t |  | 18 | 18 | 18 | 0 | 10.760 | 0.099 | gtfs.trips.n118021276.routeId |
| DELETE | trip | 0000000000000000003c |  | 18 | 18 | 18 | 0 | 9.094 | 0.097 | gtfs.trips.n60.routeId |
| DELETE | trip | 0000000000000000003g |  | 18 | 18 | 18 | 0 | 9.034 | 0.105 | gtfs.trips.n403093704.routeId |
| DELETE | trip | 00000000000000000025 |  | 18 | 18 | 18 | 0 | 9.194 | 0.099 | gtfs.trips.n37.routeId |
| DELETE | trip | 00000000000000000015 |  | 18 | 18 | 18 | 0 | 9.104 | 0.102 | gtfs.trips.n21.routeId |
| DELETE | trip | 0000000000000000002u |  | 18 | 18 | 18 | 0 | 9.272 | 0.107 | gtfs.trips.n101243657.routeId |
| DELETE | trip | 0000000000000000003h |  | 18 | 18 | 18 | 0 | 9.558 | 0.101 | gtfs.trips.n218539895.routeId |
| DELETE | trip | 0000000000000000000f |  | 18 | 18 | 18 | 0 | 9.110 | 0.100 | gtfs.trips.n15.routeId |
| DELETE | trip | 0000000000000000000k |  | 18 | 18 | 18 | 0 | 9.109 | 0.101 | gtfs.trips.n1798952325.routeId |
| DELETE | trip | 00000000000000000022 |  | 18 | 18 | 18 | 0 | 8.907 | 0.126 | gtfs.trips.n34.routeId |
| DELETE | trip | 0000000000000000002o |  | 18 | 18 | 18 | 0 | 9.381 | 0.097 | gtfs.trips.n1732136039.routeId |
| DELETE | trip | 0000000000000000000l |  | 18 | 18 | 18 | 0 | 9.646 | 0.218 | gtfs.trips.n1782174706.routeId |
| DELETE | trip | 0000000000000000001y |  | 18 | 18 | 18 | 0 | 9.242 | 0.104 | gtfs.trips.n33588728.routeId |
| DELETE | trip | 00000000000000000029 |  | 18 | 18 | 18 | 0 | 9.205 | 0.168 | gtfs.trips.n41.routeId |
| DELETE | trip | 0000000000000000000q |  | 18 | 18 | 18 | 0 | 9.337 | 0.101 | gtfs.trips.n1966728515.routeId |
| DELETE | route | 0000000000000000000c |  | 10 | 10 | 10 | 0 | 10.995 | 0.144 | gtfs.routes.n12.active |
| DELETE | route | 00000000000000000008 |  | 10 | 10 | 10 | 0 | 10.938 | 0.050 | gtfs.routes.n8.active |
| DELETE | route | 00000000000000000007 |  | 10 | 10 | 10 | 0 | 8.677 | 0.077 | gtfs.routes.n7.active |
| UPDATE | service | 00000000000000000003 | tuesday | 1 | 1 | 0 | 1 | 0.424 | 0.214 | gtfs.services.n3.tuesday |
| UPDATE | service | 00000000000000000003 | wednesday | 1 | 1 | 0 | 1 | 0.429 | 0.215 | gtfs.services.n3.wednesday |
| UPDATE | service | 00000000000000000003 | thursday | 1 | 1 | 0 | 1 | 0.370 | 0.168 | gtfs.services.n3.thursday |
| UPDATE | service | 00000000000000000003 | friday | 1 | 1 | 0 | 1 | 0.389 | 0.162 | gtfs.services.n3.friday |
| CREATE | service | SERVICE00 |  | 1 | 1 | 1 | 0 | 0.411 | 0.005 | gtfs.idx.serviceMember.n242928581 |
| CREATE | service | SERVICE01 |  | 1 | 1 | 1 | 0 | 0.323 | 0.004 | gtfs.idx.serviceMember.n259706200 |
| CREATE | service | SERVICE02 |  | 1 | 1 | 1 | 0 | 1.516 | 0.007 | gtfs.idx.serviceMember.n276483819 |
| CREATE | route | ROUTE00 |  | 1 | 1 | 1 | 0 | 0.268 | 0.005 | gtfs.idx.routeMember.n1916039695 |
| CREATE | route | ROUTE01 |  | 1 | 1 | 1 | 0 | 0.189 | 0.005 | gtfs.idx.routeMember.n1932817314 |
| CREATE | route | ROUTE02 |  | 1 | 1 | 1 | 0 | 0.176 | 0.004 | gtfs.idx.routeMember.n1882484457 |
| CREATE | trip | TRIP00 |  | 1 | 1 | 1 | 0 | 0.323 | 0.007 | gtfs.idx.routes.n1916039695.tripMember.n69849211 |
| CREATE | trip | TRIP01 |  | 1 | 1 | 1 | 0 | 0.233 | 0.005 | gtfs.idx.routes.n1916039695.tripMember.n86626830 |
| CREATE | trip | TRIP02 |  | 1 | 1 | 1 | 0 | 0.260 | 0.005 | gtfs.idx.routes.n1916039695.tripMember.n36293973 |
| CREATE | trip | TRIP03 |  | 1 | 1 | 1 | 0 | 0.254 | 0.006 | gtfs.idx.routes.n1916039695.tripMember.n53071592 |
| CREATE | trip | TRIP04 |  | 1 | 1 | 1 | 0 | 0.332 | 0.007 | gtfs.idx.routes.n1916039695.tripMember.n2738735 |
| CREATE | trip | TRIP05 |  | 1 | 1 | 1 | 0 | 0.264 | 0.006 | gtfs.idx.routes.n1916039695.tripMember.n19516354 |
| CREATE | trip | TRIP06 |  | 1 | 1 | 1 | 0 | 0.268 | 0.006 | gtfs.idx.routes.n1916039695.tripMember.n1969183497 |
| CREATE | trip | TRIP07 |  | 1 | 1 | 1 | 0 | 0.254 | 0.009 | gtfs.idx.routes.n1916039695.tripMember.n1985961116 |
| CREATE | trip | TRIP08 |  | 1 | 1 | 1 | 0 | 0.327 | 0.006 | gtfs.idx.routes.n1932817314.tripMember.n1935628259 |
| CREATE | trip | TRIP09 |  | 1 | 1 | 1 | 0 | 0.282 | 0.007 | gtfs.idx.routes.n1932817314.tripMember.n1952405878 |
| CREATE | trip | TRIP010 |  | 1 | 1 | 1 | 0 | 0.266 | 0.006 | gtfs.idx.routes.n1932817314.tripMember.n961567240 |
| CREATE | trip | TRIP011 |  | 1 | 1 | 1 | 0 | 0.250 | 0.006 | gtfs.idx.routes.n1932817314.tripMember.n944789621 |
| CREATE | trip | TRIP012 |  | 1 | 1 | 1 | 0 | 0.341 | 0.006 | gtfs.idx.routes.n1932817314.tripMember.n995122478 |
| CREATE | trip | TRIP013 |  | 1 | 1 | 1 | 0 | 0.332 | 0.006 | gtfs.idx.routes.n1932817314.tripMember.n978344859 |
| CREATE | trip | TRIP014 |  | 1 | 1 | 1 | 0 | 0.263 | 0.006 | gtfs.idx.routes.n1932817314.tripMember.n894456764 |
| CREATE | trip | TRIP015 |  | 1 | 1 | 1 | 0 | 0.273 | 0.006 | gtfs.idx.routes.n1932817314.tripMember.n877679145 |
| CREATE | trip | TRIP016 |  | 1 | 1 | 1 | 0 | 0.265 | 0.006 | gtfs.idx.routes.n1932817314.tripMember.n928012002 |
| CREATE | trip | TRIP017 |  | 1 | 1 | 1 | 0 | 0.257 | 0.005 | gtfs.idx.routes.n1932817314.tripMember.n911234383 |
| CREATE | trip | TRIP018 |  | 1 | 1 | 1 | 0 | 0.268 | 0.005 | gtfs.idx.routes.n1932817314.tripMember.n827346288 |
| CREATE | trip | TRIP019 |  | 1 | 1 | 1 | 0 | 0.192 | 0.005 | gtfs.idx.routes.n1882484457.tripMember.n810568669 |
| CREATE | trip | TRIP020 |  | 1 | 1 | 1 | 0 | 0.185 | 0.005 | gtfs.idx.routes.n1882484457.tripMember.n511593581 |
| CREATE | stopTime | TRIP00||STOP00 |  | 1 | 1 | 1 | 0 | 0.209 | 0.006 | gtfs.idx.trips.n69849211.stopTimeMember.n69849211_0_STOP00 |
| CREATE | stopTime | TRIP00||STOP01 |  | 1 | 1 | 1 | 0 | 0.166 | 0.006 | gtfs.idx.trips.n69849211.stopTimeMember.n69849211_0_STOP01 |
| CREATE | stopTime | TRIP01||STOP02 |  | 1 | 1 | 1 | 0 | 0.165 | 0.005 | gtfs.idx.trips.n86626830.stopTimeMember.n86626830_0_STOP02 |
| CREATE | stopTime | TRIP01||STOP03 |  | 1 | 1 | 1 | 0 | 0.152 | 0.006 | gtfs.idx.trips.n86626830.stopTimeMember.n86626830_0_STOP03 |
| CREATE | stopTime | TRIP02||STOP04 |  | 1 | 1 | 1 | 0 | 0.232 | 0.006 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP04 |
| CREATE | stopTime | TRIP02||STOP05 |  | 1 | 1 | 1 | 0 | 0.199 | 0.006 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP05 |
| CREATE | stopTime | TRIP02||STOP06 |  | 1 | 1 | 1 | 0 | 0.227 | 0.006 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP06 |
| CREATE | stopTime | TRIP02||STOP07 |  | 1 | 1 | 1 | 0 | 0.432 | 0.009 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP07 |
| CREATE | stopTime | TRIP02||STOP08 |  | 1 | 1 | 1 | 0 | 0.552 | 0.013 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP08 |
| CREATE | stopTime | TRIP02||STOP09 |  | 1 | 1 | 1 | 0 | 0.437 | 0.013 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP09 |
| CREATE | stopTime | TRIP02||STOP010 |  | 1 | 1 | 1 | 0 | 0.389 | 0.011 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP010 |
| CREATE | stopTime | TRIP02||STOP011 |  | 1 | 1 | 1 | 0 | 0.353 | 0.012 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP011 |
| CREATE | stopTime | TRIP03||STOP012 |  | 1 | 1 | 1 | 0 | 0.406 | 0.014 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP012 |
| CREATE | stopTime | TRIP03||STOP013 |  | 1 | 1 | 1 | 0 | 0.260 | 0.008 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP013 |
| CREATE | stopTime | TRIP03||STOP014 |  | 1 | 1 | 1 | 0 | 0.200 | 0.006 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP014 |
| CREATE | stopTime | TRIP03||STOP015 |  | 1 | 1 | 1 | 0 | 0.185 | 0.005 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP015 |
| CREATE | stopTime | TRIP03||STOP016 |  | 1 | 1 | 1 | 0 | 0.196 | 0.007 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP016 |
| CREATE | stopTime | TRIP03||STOP017 |  | 1 | 1 | 1 | 0 | 0.185 | 0.006 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP017 |
| CREATE | stopTime | TRIP04||STOP018 |  | 1 | 1 | 1 | 0 | 0.169 | 0.006 | gtfs.idx.trips.n2738735.stopTimeMember.n2738735_0_STOP018 |
| CREATE | stopTime | TRIP04||STOP019 |  | 1 | 1 | 1 | 0 | 0.147 | 0.006 | gtfs.idx.trips.n2738735.stopTimeMember.n2738735_0_STOP019 |
| CREATE | stopTime | TRIP05||STOP020 |  | 1 | 1 | 1 | 0 | 0.166 | 0.005 | gtfs.idx.trips.n19516354.stopTimeMember.n19516354_0_STOP020 |
| CREATE | stopTime | TRIP05||STOP021 |  | 1 | 1 | 1 | 0 | 0.181 | 0.006 | gtfs.idx.trips.n19516354.stopTimeMember.n19516354_0_STOP021 |
| CREATE | stopTime | TRIP05||STOP022 |  | 1 | 1 | 1 | 0 | 0.165 | 0.006 | gtfs.idx.trips.n19516354.stopTimeMember.n19516354_0_STOP022 |
| CREATE | stopTime | TRIP06||STOP023 |  | 1 | 1 | 1 | 0 | 0.207 | 0.006 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP023 |
| CREATE | stopTime | TRIP06||STOP024 |  | 1 | 1 | 1 | 0 | 0.220 | 0.007 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP024 |
| CREATE | stopTime | TRIP06||STOP025 |  | 1 | 1 | 1 | 0 | 0.203 | 0.006 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP025 |
| CREATE | stopTime | TRIP06||STOP026 |  | 1 | 1 | 1 | 0 | 0.169 | 0.006 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP026 |
| CREATE | stopTime | TRIP06||STOP027 |  | 1 | 1 | 1 | 0 | 0.170 | 0.006 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP027 |
| CREATE | stopTime | TRIP07||STOP028 |  | 1 | 1 | 1 | 0 | 0.297 | 0.010 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP028 |
| CREATE | stopTime | TRIP07||STOP029 |  | 1 | 1 | 1 | 0 | 0.191 | 0.006 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP029 |
| CREATE | stopTime | TRIP07||STOP030 |  | 1 | 1 | 1 | 0 | 0.225 | 0.008 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP030 |
| CREATE | stopTime | TRIP07||STOP031 |  | 1 | 1 | 1 | 0 | 0.293 | 0.008 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP031 |
| CREATE | stopTime | TRIP07||STOP032 |  | 1 | 1 | 1 | 0 | 0.252 | 0.008 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP032 |
| CREATE | stopTime | TRIP08||STOP033 |  | 1 | 1 | 1 | 0 | 0.299 | 0.009 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP033 |
| CREATE | stopTime | TRIP08||STOP034 |  | 1 | 1 | 1 | 0 | 0.355 | 0.010 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP034 |
| CREATE | stopTime | TRIP08||STOP035 |  | 1 | 1 | 1 | 0 | 1.319 | 0.022 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP035 |
| CREATE | stopTime | TRIP08||STOP036 |  | 1 | 1 | 1 | 0 | 0.243 | 0.010 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP036 |
| CREATE | stopTime | TRIP08||STOP037 |  | 1 | 1 | 1 | 0 | 0.229 | 0.006 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP037 |
| CREATE | stopTime | TRIP08||STOP038 |  | 1 | 1 | 1 | 0 | 0.192 | 0.006 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP038 |
| CREATE | stopTime | TRIP09||STOP039 |  | 1 | 1 | 1 | 0 | 0.235 | 0.006 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP039 |
| CREATE | stopTime | TRIP09||STOP040 |  | 1 | 1 | 1 | 0 | 0.217 | 0.006 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP040 |
| CREATE | stopTime | TRIP09||STOP041 |  | 1 | 1 | 1 | 0 | 0.211 | 0.008 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP041 |
| CREATE | stopTime | TRIP09||STOP042 |  | 1 | 1 | 1 | 0 | 0.222 | 0.006 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP042 |
| CREATE | stopTime | TRIP09||STOP043 |  | 1 | 1 | 1 | 0 | 0.210 | 0.006 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP043 |
| CREATE | stopTime | TRIP09||STOP044 |  | 1 | 1 | 1 | 0 | 0.197 | 0.006 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP044 |
| CREATE | stopTime | TRIP09||STOP045 |  | 1 | 1 | 1 | 0 | 0.197 | 0.006 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP045 |
| CREATE | stopTime | TRIP09||STOP046 |  | 1 | 1 | 1 | 0 | 0.196 | 0.006 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP046 |
| CREATE | stopTime | TRIP010||STOP047 |  | 1 | 1 | 1 | 0 | 0.181 | 0.006 | gtfs.idx.trips.n961567240.stopTimeMember.n961567240_0_STOP047 |
| CREATE | stopTime | TRIP011||STOP048 |  | 1 | 1 | 1 | 0 | 0.164 | 0.005 | gtfs.idx.trips.n944789621.stopTimeMember.n944789621_0_STOP048 |
| CREATE | stopTime | TRIP011||STOP049 |  | 1 | 1 | 1 | 0 | 0.226 | 0.006 | gtfs.idx.trips.n944789621.stopTimeMember.n944789621_0_STOP049 |
| CREATE | stopTime | TRIP012||STOP050 |  | 1 | 1 | 1 | 0 | 0.182 | 0.006 | gtfs.idx.trips.n995122478.stopTimeMember.n995122478_0_STOP050 |
| CREATE | stopTime | TRIP012||STOP051 |  | 1 | 1 | 1 | 0 | 0.212 | 0.008 | gtfs.idx.trips.n995122478.stopTimeMember.n995122478_0_STOP051 |
| CREATE | stopTime | TRIP012||STOP052 |  | 1 | 1 | 1 | 0 | 0.169 | 0.006 | gtfs.idx.trips.n995122478.stopTimeMember.n995122478_0_STOP052 |
| CREATE | stopTime | TRIP012||STOP053 |  | 1 | 1 | 1 | 0 | 0.162 | 0.006 | gtfs.idx.trips.n995122478.stopTimeMember.n995122478_0_STOP053 |
| CREATE | stopTime | TRIP013||STOP054 |  | 1 | 1 | 1 | 0 | 0.218 | 0.006 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP054 |
| CREATE | stopTime | TRIP013||STOP055 |  | 1 | 1 | 1 | 0 | 0.185 | 0.006 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP055 |
| CREATE | stopTime | TRIP013||STOP056 |  | 1 | 1 | 1 | 0 | 0.325 | 0.008 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP056 |
| CREATE | stopTime | TRIP013||STOP057 |  | 1 | 1 | 1 | 0 | 0.218 | 0.005 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP057 |
| CREATE | stopTime | TRIP013||STOP058 |  | 1 | 1 | 1 | 0 | 0.181 | 0.005 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP058 |
| CREATE | stopTime | TRIP013||STOP059 |  | 1 | 1 | 1 | 0 | 0.172 | 0.006 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP059 |
| CREATE | stopTime | TRIP014||STOP060 |  | 1 | 1 | 1 | 0 | 0.263 | 0.006 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP060 |
| CREATE | stopTime | TRIP014||STOP061 |  | 1 | 1 | 1 | 0 | 0.251 | 0.006 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP061 |
| CREATE | stopTime | TRIP014||STOP062 |  | 1 | 1 | 1 | 0 | 0.206 | 0.006 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP062 |
| CREATE | stopTime | TRIP014||STOP063 |  | 1 | 1 | 1 | 0 | 0.264 | 0.006 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP063 |
| CREATE | stopTime | TRIP014||STOP064 |  | 1 | 1 | 1 | 0 | 0.216 | 0.006 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP064 |
| CREATE | stopTime | TRIP014||STOP065 |  | 1 | 1 | 1 | 0 | 0.247 | 0.006 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP065 |
| CREATE | stopTime | TRIP014||STOP066 |  | 1 | 1 | 1 | 0 | 0.201 | 0.006 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP066 |
| CREATE | stopTime | TRIP014||STOP067 |  | 1 | 1 | 1 | 0 | 0.278 | 0.010 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP067 |
| CREATE | stopTime | TRIP015||STOP068 |  | 1 | 1 | 1 | 0 | 0.233 | 0.009 | gtfs.idx.trips.n877679145.stopTimeMember.n877679145_0_STOP068 |
| CREATE | stopTime | TRIP015||STOP069 |  | 1 | 1 | 1 | 0 | 0.180 | 0.006 | gtfs.idx.trips.n877679145.stopTimeMember.n877679145_0_STOP069 |
| CREATE | stopTime | TRIP016||STOP070 |  | 1 | 1 | 1 | 0 | 0.181 | 0.006 | gtfs.idx.trips.n928012002.stopTimeMember.n928012002_0_STOP070 |
| CREATE | stopTime | TRIP016||STOP071 |  | 1 | 1 | 1 | 0 | 0.224 | 0.009 | gtfs.idx.trips.n928012002.stopTimeMember.n928012002_0_STOP071 |
| CREATE | stopTime | TRIP016||STOP072 |  | 1 | 1 | 1 | 0 | 0.199 | 0.006 | gtfs.idx.trips.n928012002.stopTimeMember.n928012002_0_STOP072 |
| CREATE | stopTime | TRIP017||STOP073 |  | 1 | 1 | 1 | 0 | 0.267 | 0.008 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP073 |
| CREATE | stopTime | TRIP017||STOP074 |  | 1 | 1 | 1 | 0 | 0.199 | 0.008 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP074 |
| CREATE | stopTime | TRIP017||STOP075 |  | 1 | 1 | 1 | 0 | 0.195 | 0.005 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP075 |
| CREATE | stopTime | TRIP017||STOP076 |  | 1 | 1 | 1 | 0 | 0.199 | 0.005 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP076 |
| CREATE | stopTime | TRIP017||STOP077 |  | 1 | 1 | 1 | 0 | 0.272 | 0.007 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP077 |
| CREATE | stopTime | TRIP017||STOP078 |  | 1 | 1 | 1 | 0 | 0.204 | 0.005 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP078 |
| CREATE | stopTime | TRIP017||STOP079 |  | 1 | 1 | 1 | 0 | 0.199 | 0.005 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP079 |
| CREATE | stopTime | TRIP018||STOP080 |  | 1 | 1 | 1 | 0 | 0.160 | 0.005 | gtfs.idx.trips.n827346288.stopTimeMember.n827346288_0_STOP080 |
| CREATE | stopTime | TRIP019||STOP081 |  | 1 | 1 | 1 | 0 | 0.145 | 0.006 | gtfs.idx.trips.n810568669.stopTimeMember.n810568669_0_STOP081 |
| CREATE | stopTime | TRIP020||STOP082 |  | 1 | 1 | 1 | 0 | 0.155 | 0.006 | gtfs.idx.trips.n511593581.stopTimeMember.n511593581_0_STOP082 |
| CREATE | stopTime | TRIP020||STOP083 |  | 1 | 1 | 1 | 0 | 0.146 | 0.005 | gtfs.idx.trips.n511593581.stopTimeMember.n511593581_0_STOP083 |
