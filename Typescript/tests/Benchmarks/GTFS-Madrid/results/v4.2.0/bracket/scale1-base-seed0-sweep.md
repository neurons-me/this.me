# base→seed0 sweep (propagation only)

Claim: dependency propagation — NOT RML materialization.

Run: this.me@4.2.0 (dist/me.es.js sha256 8cc94d5273b0…), Node v22.23.3, Intel(R) Xeon(R) Processor × 8, 16 GiB, Linux 6.12.94+ x64; count aggregates: bracket; 2026-10-10T23:10:07.518Z

CREATE semantics: `gtfs.idx` membership + parent `*Count` sum aggregates (slot 0→1).
Calendar: `active` derived from mon–sun + numeric start/end dates.

| metric | value |
|---|---|
| measured N | 151 |
| skipped | 0 |
| CREATE/UPDATE/DELETE | 111/7/33 |
| loadMs | 951.24 |
| k mean / p50 / p95 / max | 5.106 / 1 / 18.500 / 27 |
| k CREATE mean/p50/max | 1 / 1 / 1 (n=111) |
| k UPDATE mean/p50/max | 12.143 / 1 / 27 (n=7) |
| k DELETE mean/p50/max | 17.424 / 18 / 19 (n=33) |
| recomputeMs (probe read-back after the write) p50 / p95 / p99 | 0.016 / 0.134 / 0.186 |
| applyMs (the write, including its propagation wave) p50 / p95 / p99 | 3.484 / 8.467 / 9.947 |
| total recomputed / changed / unchanged | 771 / 767 / 4 |
| early-cutoff (unchanged/recomputed) | 0.0052 |

## Per-mutation (sorted by k desc)

| type | kind | id | field | k | recomputed | changed | unchanged | applyMs | recomputeMs | sourcePath |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| UPDATE | service | 00000000000000000003 | monday | 27 | 27 | 27 | 0 | 2.161 | 0.190 | gtfs.services.n3.monday |
| UPDATE | service | 00000000000000000003 | startDate | 27 | 27 | 27 | 0 | 1.002 | 0.110 | gtfs.services.n3.startDate |
| UPDATE | service | 00000000000000000003 | endDate | 27 | 27 | 27 | 0 | 0.924 | 0.137 | gtfs.services.n3.endDate |
| DELETE | trip | 00000000000000000033 |  | 19 | 19 | 19 | 0 | 8.471 | 0.103 | gtfs.trips.n51.routeId |
| DELETE | trip | 00000000000000000014 |  | 19 | 19 | 19 | 0 | 8.154 | 0.138 | gtfs.trips.n20.routeId |
| DELETE | trip | 0000000000000000002q |  | 19 | 19 | 19 | 0 | 8.264 | 0.106 | gtfs.trips.n168354133.routeId |
| DELETE | trip | 0000000000000000002d |  | 19 | 19 | 19 | 0 | 10.493 | 0.102 | gtfs.trips.n45.routeId |
| DELETE | trip | 0000000000000000000b |  | 19 | 19 | 19 | 0 | 8.490 | 0.129 | gtfs.trips.n11.routeId |
| DELETE | trip | 00000000000000000005 |  | 18 | 18 | 18 | 0 | 9.374 | 0.115 | gtfs.trips.n5.routeId |
| DELETE | trip | 0000000000000000003m |  | 18 | 18 | 18 | 0 | 8.253 | 0.106 | gtfs.trips.n302427990.routeId |
| DELETE | trip | 0000000000000000001g |  | 18 | 18 | 18 | 0 | 7.892 | 0.131 | gtfs.trips.n134254442.routeId |
| DELETE | trip | 0000000000000000003d |  | 18 | 18 | 18 | 0 | 7.915 | 0.099 | gtfs.trips.n61.routeId |
| DELETE | trip | 0000000000000000003b |  | 18 | 18 | 18 | 0 | 7.847 | 0.100 | gtfs.trips.n59.routeId |
| DELETE | trip | 0000000000000000001n |  | 18 | 18 | 18 | 0 | 8.247 | 0.102 | gtfs.trips.n251697775.routeId |
| DELETE | trip | 00000000000000000012 |  | 18 | 18 | 18 | 0 | 8.171 | 0.103 | gtfs.trips.n18.routeId |
| DELETE | trip | 0000000000000000002v |  | 18 | 18 | 18 | 0 | 8.072 | 0.105 | gtfs.trips.n151576514.routeId |
| DELETE | trip | 00000000000000000017 |  | 18 | 18 | 18 | 0 | 8.111 | 0.107 | gtfs.trips.n23.routeId |
| DELETE | trip | 0000000000000000000a |  | 18 | 18 | 18 | 0 | 9.456 | 0.099 | gtfs.trips.n10.routeId |
| DELETE | trip | 0000000000000000002t |  | 18 | 18 | 18 | 0 | 8.351 | 0.110 | gtfs.trips.n118021276.routeId |
| DELETE | trip | 0000000000000000003c |  | 18 | 18 | 18 | 0 | 8.347 | 0.105 | gtfs.trips.n60.routeId |
| DELETE | trip | 0000000000000000003g |  | 18 | 18 | 18 | 0 | 8.233 | 0.128 | gtfs.trips.n403093704.routeId |
| DELETE | trip | 00000000000000000025 |  | 18 | 18 | 18 | 0 | 7.983 | 0.106 | gtfs.trips.n37.routeId |
| DELETE | trip | 00000000000000000015 |  | 18 | 18 | 18 | 0 | 8.100 | 0.103 | gtfs.trips.n21.routeId |
| DELETE | trip | 0000000000000000002u |  | 18 | 18 | 18 | 0 | 8.348 | 0.105 | gtfs.trips.n101243657.routeId |
| DELETE | trip | 0000000000000000003h |  | 18 | 18 | 18 | 0 | 8.322 | 0.143 | gtfs.trips.n218539895.routeId |
| DELETE | trip | 0000000000000000000f |  | 18 | 18 | 18 | 0 | 8.410 | 0.113 | gtfs.trips.n15.routeId |
| DELETE | trip | 0000000000000000000k |  | 18 | 18 | 18 | 0 | 8.462 | 0.108 | gtfs.trips.n1798952325.routeId |
| DELETE | trip | 00000000000000000022 |  | 18 | 18 | 18 | 0 | 8.376 | 0.145 | gtfs.trips.n34.routeId |
| DELETE | trip | 0000000000000000002o |  | 18 | 18 | 18 | 0 | 10.439 | 0.099 | gtfs.trips.n1732136039.routeId |
| DELETE | trip | 0000000000000000000l |  | 18 | 18 | 18 | 0 | 8.069 | 0.125 | gtfs.trips.n1782174706.routeId |
| DELETE | trip | 0000000000000000001y |  | 18 | 18 | 18 | 0 | 8.152 | 0.131 | gtfs.trips.n33588728.routeId |
| DELETE | trip | 00000000000000000029 |  | 18 | 18 | 18 | 0 | 8.284 | 0.101 | gtfs.trips.n41.routeId |
| DELETE | trip | 0000000000000000000q |  | 18 | 18 | 18 | 0 | 7.985 | 0.099 | gtfs.trips.n1966728515.routeId |
| DELETE | route | 0000000000000000000c |  | 10 | 10 | 10 | 0 | 9.208 | 0.127 | gtfs.routes.n12.active |
| DELETE | route | 00000000000000000008 |  | 10 | 10 | 10 | 0 | 8.519 | 0.054 | gtfs.routes.n8.active |
| DELETE | route | 00000000000000000007 |  | 10 | 10 | 10 | 0 | 7.977 | 0.051 | gtfs.routes.n7.active |
| UPDATE | service | 00000000000000000003 | tuesday | 1 | 1 | 0 | 1 | 0.499 | 0.182 | gtfs.services.n3.tuesday |
| UPDATE | service | 00000000000000000003 | wednesday | 1 | 1 | 0 | 1 | 0.459 | 0.216 | gtfs.services.n3.wednesday |
| UPDATE | service | 00000000000000000003 | thursday | 1 | 1 | 0 | 1 | 0.410 | 0.181 | gtfs.services.n3.thursday |
| UPDATE | service | 00000000000000000003 | friday | 1 | 1 | 0 | 1 | 0.380 | 0.112 | gtfs.services.n3.friday |
| CREATE | service | SERVICE00 |  | 1 | 1 | 1 | 0 | 3.786 | 0.017 | gtfs.idx.serviceMember.n242928581.on |
| CREATE | service | SERVICE01 |  | 1 | 1 | 1 | 0 | 3.465 | 0.014 | gtfs.idx.serviceMember.n259706200.on |
| CREATE | service | SERVICE02 |  | 1 | 1 | 1 | 0 | 3.564 | 0.013 | gtfs.idx.serviceMember.n276483819.on |
| CREATE | route | ROUTE00 |  | 1 | 1 | 1 | 0 | 3.360 | 0.013 | gtfs.idx.routeMember.n1916039695.on |
| CREATE | route | ROUTE01 |  | 1 | 1 | 1 | 0 | 3.513 | 0.019 | gtfs.idx.routeMember.n1932817314.on |
| CREATE | route | ROUTE02 |  | 1 | 1 | 1 | 0 | 3.390 | 0.016 | gtfs.idx.routeMember.n1882484457.on |
| CREATE | trip | TRIP00 |  | 1 | 1 | 1 | 0 | 3.546 | 0.016 | gtfs.idx.routes.n1916039695.tripMember.n69849211.on |
| CREATE | trip | TRIP01 |  | 1 | 1 | 1 | 0 | 3.574 | 0.016 | gtfs.idx.routes.n1916039695.tripMember.n86626830.on |
| CREATE | trip | TRIP02 |  | 1 | 1 | 1 | 0 | 3.512 | 0.015 | gtfs.idx.routes.n1916039695.tripMember.n36293973.on |
| CREATE | trip | TRIP03 |  | 1 | 1 | 1 | 0 | 3.618 | 0.016 | gtfs.idx.routes.n1916039695.tripMember.n53071592.on |
| CREATE | trip | TRIP04 |  | 1 | 1 | 1 | 0 | 5.775 | 0.026 | gtfs.idx.routes.n1916039695.tripMember.n2738735.on |
| CREATE | trip | TRIP05 |  | 1 | 1 | 1 | 0 | 3.365 | 0.016 | gtfs.idx.routes.n1916039695.tripMember.n19516354.on |
| CREATE | trip | TRIP06 |  | 1 | 1 | 1 | 0 | 3.351 | 0.014 | gtfs.idx.routes.n1916039695.tripMember.n1969183497.on |
| CREATE | trip | TRIP07 |  | 1 | 1 | 1 | 0 | 3.460 | 0.016 | gtfs.idx.routes.n1916039695.tripMember.n1985961116.on |
| CREATE | trip | TRIP08 |  | 1 | 1 | 1 | 0 | 3.375 | 0.014 | gtfs.idx.routes.n1932817314.tripMember.n1935628259.on |
| CREATE | trip | TRIP09 |  | 1 | 1 | 1 | 0 | 3.468 | 0.014 | gtfs.idx.routes.n1932817314.tripMember.n1952405878.on |
| CREATE | trip | TRIP010 |  | 1 | 1 | 1 | 0 | 3.429 | 0.015 | gtfs.idx.routes.n1932817314.tripMember.n961567240.on |
| CREATE | trip | TRIP011 |  | 1 | 1 | 1 | 0 | 3.393 | 0.016 | gtfs.idx.routes.n1932817314.tripMember.n944789621.on |
| CREATE | trip | TRIP012 |  | 1 | 1 | 1 | 0 | 3.366 | 0.014 | gtfs.idx.routes.n1932817314.tripMember.n995122478.on |
| CREATE | trip | TRIP013 |  | 1 | 1 | 1 | 0 | 3.788 | 0.024 | gtfs.idx.routes.n1932817314.tripMember.n978344859.on |
| CREATE | trip | TRIP014 |  | 1 | 1 | 1 | 0 | 3.324 | 0.015 | gtfs.idx.routes.n1932817314.tripMember.n894456764.on |
| CREATE | trip | TRIP015 |  | 1 | 1 | 1 | 0 | 3.401 | 0.015 | gtfs.idx.routes.n1932817314.tripMember.n877679145.on |
| CREATE | trip | TRIP016 |  | 1 | 1 | 1 | 0 | 3.483 | 0.015 | gtfs.idx.routes.n1932817314.tripMember.n928012002.on |
| CREATE | trip | TRIP017 |  | 1 | 1 | 1 | 0 | 3.314 | 0.015 | gtfs.idx.routes.n1932817314.tripMember.n911234383.on |
| CREATE | trip | TRIP018 |  | 1 | 1 | 1 | 0 | 3.299 | 0.015 | gtfs.idx.routes.n1932817314.tripMember.n827346288.on |
| CREATE | trip | TRIP019 |  | 1 | 1 | 1 | 0 | 3.381 | 0.015 | gtfs.idx.routes.n1882484457.tripMember.n810568669.on |
| CREATE | trip | TRIP020 |  | 1 | 1 | 1 | 0 | 3.225 | 0.013 | gtfs.idx.routes.n1882484457.tripMember.n511593581.on |
| CREATE | stopTime | TRIP00||STOP00 |  | 1 | 1 | 1 | 0 | 3.344 | 0.014 | gtfs.idx.trips.n69849211.stopTimeMember.n69849211_0_STOP00.on |
| CREATE | stopTime | TRIP00||STOP01 |  | 1 | 1 | 1 | 0 | 3.347 | 0.015 | gtfs.idx.trips.n69849211.stopTimeMember.n69849211_0_STOP01.on |
| CREATE | stopTime | TRIP01||STOP02 |  | 1 | 1 | 1 | 0 | 3.171 | 0.013 | gtfs.idx.trips.n86626830.stopTimeMember.n86626830_0_STOP02.on |
| CREATE | stopTime | TRIP01||STOP03 |  | 1 | 1 | 1 | 0 | 3.395 | 0.013 | gtfs.idx.trips.n86626830.stopTimeMember.n86626830_0_STOP03.on |
| CREATE | stopTime | TRIP02||STOP04 |  | 1 | 1 | 1 | 0 | 3.473 | 0.015 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP04.on |
| CREATE | stopTime | TRIP02||STOP05 |  | 1 | 1 | 1 | 0 | 3.403 | 0.014 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP05.on |
| CREATE | stopTime | TRIP02||STOP06 |  | 1 | 1 | 1 | 0 | 3.452 | 0.014 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP06.on |
| CREATE | stopTime | TRIP02||STOP07 |  | 1 | 1 | 1 | 0 | 3.416 | 0.014 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP07.on |
| CREATE | stopTime | TRIP02||STOP08 |  | 1 | 1 | 1 | 0 | 3.868 | 0.017 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP08.on |
| CREATE | stopTime | TRIP02||STOP09 |  | 1 | 1 | 1 | 0 | 3.486 | 0.016 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP09.on |
| CREATE | stopTime | TRIP02||STOP010 |  | 1 | 1 | 1 | 0 | 3.708 | 0.015 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP010.on |
| CREATE | stopTime | TRIP02||STOP011 |  | 1 | 1 | 1 | 0 | 3.504 | 0.016 | gtfs.idx.trips.n36293973.stopTimeMember.n36293973_0_STOP011.on |
| CREATE | stopTime | TRIP03||STOP012 |  | 1 | 1 | 1 | 0 | 6.191 | 0.018 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP012.on |
| CREATE | stopTime | TRIP03||STOP013 |  | 1 | 1 | 1 | 0 | 3.519 | 0.015 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP013.on |
| CREATE | stopTime | TRIP03||STOP014 |  | 1 | 1 | 1 | 0 | 3.454 | 0.018 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP014.on |
| CREATE | stopTime | TRIP03||STOP015 |  | 1 | 1 | 1 | 0 | 3.321 | 0.015 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP015.on |
| CREATE | stopTime | TRIP03||STOP016 |  | 1 | 1 | 1 | 0 | 3.537 | 0.017 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP016.on |
| CREATE | stopTime | TRIP03||STOP017 |  | 1 | 1 | 1 | 0 | 3.546 | 0.016 | gtfs.idx.trips.n53071592.stopTimeMember.n53071592_0_STOP017.on |
| CREATE | stopTime | TRIP04||STOP018 |  | 1 | 1 | 1 | 0 | 3.411 | 0.017 | gtfs.idx.trips.n2738735.stopTimeMember.n2738735_0_STOP018.on |
| CREATE | stopTime | TRIP04||STOP019 |  | 1 | 1 | 1 | 0 | 3.354 | 0.014 | gtfs.idx.trips.n2738735.stopTimeMember.n2738735_0_STOP019.on |
| CREATE | stopTime | TRIP05||STOP020 |  | 1 | 1 | 1 | 0 | 3.755 | 0.016 | gtfs.idx.trips.n19516354.stopTimeMember.n19516354_0_STOP020.on |
| CREATE | stopTime | TRIP05||STOP021 |  | 1 | 1 | 1 | 0 | 3.464 | 0.015 | gtfs.idx.trips.n19516354.stopTimeMember.n19516354_0_STOP021.on |
| CREATE | stopTime | TRIP05||STOP022 |  | 1 | 1 | 1 | 0 | 3.415 | 0.015 | gtfs.idx.trips.n19516354.stopTimeMember.n19516354_0_STOP022.on |
| CREATE | stopTime | TRIP06||STOP023 |  | 1 | 1 | 1 | 0 | 3.464 | 0.016 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP023.on |
| CREATE | stopTime | TRIP06||STOP024 |  | 1 | 1 | 1 | 0 | 3.402 | 0.015 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP024.on |
| CREATE | stopTime | TRIP06||STOP025 |  | 1 | 1 | 1 | 0 | 3.541 | 0.015 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP025.on |
| CREATE | stopTime | TRIP06||STOP026 |  | 1 | 1 | 1 | 0 | 3.499 | 0.016 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP026.on |
| CREATE | stopTime | TRIP06||STOP027 |  | 1 | 1 | 1 | 0 | 3.456 | 0.015 | gtfs.idx.trips.n1969183497.stopTimeMember.n1969183497_0_STOP027.on |
| CREATE | stopTime | TRIP07||STOP028 |  | 1 | 1 | 1 | 0 | 3.449 | 0.016 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP028.on |
| CREATE | stopTime | TRIP07||STOP029 |  | 1 | 1 | 1 | 0 | 3.508 | 0.016 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP029.on |
| CREATE | stopTime | TRIP07||STOP030 |  | 1 | 1 | 1 | 0 | 3.449 | 0.016 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP030.on |
| CREATE | stopTime | TRIP07||STOP031 |  | 1 | 1 | 1 | 0 | 3.322 | 0.015 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP031.on |
| CREATE | stopTime | TRIP07||STOP032 |  | 1 | 1 | 1 | 0 | 3.467 | 0.019 | gtfs.idx.trips.n1985961116.stopTimeMember.n1985961116_0_STOP032.on |
| CREATE | stopTime | TRIP08||STOP033 |  | 1 | 1 | 1 | 0 | 3.341 | 0.014 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP033.on |
| CREATE | stopTime | TRIP08||STOP034 |  | 1 | 1 | 1 | 0 | 3.461 | 0.015 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP034.on |
| CREATE | stopTime | TRIP08||STOP035 |  | 1 | 1 | 1 | 0 | 3.540 | 0.016 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP035.on |
| CREATE | stopTime | TRIP08||STOP036 |  | 1 | 1 | 1 | 0 | 3.367 | 0.015 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP036.on |
| CREATE | stopTime | TRIP08||STOP037 |  | 1 | 1 | 1 | 0 | 3.392 | 0.015 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP037.on |
| CREATE | stopTime | TRIP08||STOP038 |  | 1 | 1 | 1 | 0 | 3.518 | 0.015 | gtfs.idx.trips.n1935628259.stopTimeMember.n1935628259_0_STOP038.on |
| CREATE | stopTime | TRIP09||STOP039 |  | 1 | 1 | 1 | 0 | 3.310 | 0.017 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP039.on |
| CREATE | stopTime | TRIP09||STOP040 |  | 1 | 1 | 1 | 0 | 3.593 | 0.014 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP040.on |
| CREATE | stopTime | TRIP09||STOP041 |  | 1 | 1 | 1 | 0 | 3.391 | 0.015 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP041.on |
| CREATE | stopTime | TRIP09||STOP042 |  | 1 | 1 | 1 | 0 | 3.555 | 0.016 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP042.on |
| CREATE | stopTime | TRIP09||STOP043 |  | 1 | 1 | 1 | 0 | 3.440 | 0.015 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP043.on |
| CREATE | stopTime | TRIP09||STOP044 |  | 1 | 1 | 1 | 0 | 4.060 | 0.017 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP044.on |
| CREATE | stopTime | TRIP09||STOP045 |  | 1 | 1 | 1 | 0 | 3.523 | 0.021 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP045.on |
| CREATE | stopTime | TRIP09||STOP046 |  | 1 | 1 | 1 | 0 | 3.458 | 0.015 | gtfs.idx.trips.n1952405878.stopTimeMember.n1952405878_0_STOP046.on |
| CREATE | stopTime | TRIP010||STOP047 |  | 1 | 1 | 1 | 0 | 3.424 | 0.015 | gtfs.idx.trips.n961567240.stopTimeMember.n961567240_0_STOP047.on |
| CREATE | stopTime | TRIP011||STOP048 |  | 1 | 1 | 1 | 0 | 3.637 | 0.020 | gtfs.idx.trips.n944789621.stopTimeMember.n944789621_0_STOP048.on |
| CREATE | stopTime | TRIP011||STOP049 |  | 1 | 1 | 1 | 0 | 3.359 | 0.014 | gtfs.idx.trips.n944789621.stopTimeMember.n944789621_0_STOP049.on |
| CREATE | stopTime | TRIP012||STOP050 |  | 1 | 1 | 1 | 0 | 3.379 | 0.016 | gtfs.idx.trips.n995122478.stopTimeMember.n995122478_0_STOP050.on |
| CREATE | stopTime | TRIP012||STOP051 |  | 1 | 1 | 1 | 0 | 3.441 | 0.015 | gtfs.idx.trips.n995122478.stopTimeMember.n995122478_0_STOP051.on |
| CREATE | stopTime | TRIP012||STOP052 |  | 1 | 1 | 1 | 0 | 3.340 | 0.015 | gtfs.idx.trips.n995122478.stopTimeMember.n995122478_0_STOP052.on |
| CREATE | stopTime | TRIP012||STOP053 |  | 1 | 1 | 1 | 0 | 3.464 | 0.015 | gtfs.idx.trips.n995122478.stopTimeMember.n995122478_0_STOP053.on |
| CREATE | stopTime | TRIP013||STOP054 |  | 1 | 1 | 1 | 0 | 3.527 | 0.016 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP054.on |
| CREATE | stopTime | TRIP013||STOP055 |  | 1 | 1 | 1 | 0 | 3.309 | 0.014 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP055.on |
| CREATE | stopTime | TRIP013||STOP056 |  | 1 | 1 | 1 | 0 | 3.542 | 0.015 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP056.on |
| CREATE | stopTime | TRIP013||STOP057 |  | 1 | 1 | 1 | 0 | 3.553 | 0.016 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP057.on |
| CREATE | stopTime | TRIP013||STOP058 |  | 1 | 1 | 1 | 0 | 3.448 | 0.014 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP058.on |
| CREATE | stopTime | TRIP013||STOP059 |  | 1 | 1 | 1 | 0 | 3.457 | 0.015 | gtfs.idx.trips.n978344859.stopTimeMember.n978344859_0_STOP059.on |
| CREATE | stopTime | TRIP014||STOP060 |  | 1 | 1 | 1 | 0 | 3.539 | 0.017 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP060.on |
| CREATE | stopTime | TRIP014||STOP061 |  | 1 | 1 | 1 | 0 | 3.317 | 0.014 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP061.on |
| CREATE | stopTime | TRIP014||STOP062 |  | 1 | 1 | 1 | 0 | 3.484 | 0.015 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP062.on |
| CREATE | stopTime | TRIP014||STOP063 |  | 1 | 1 | 1 | 0 | 3.508 | 0.016 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP063.on |
| CREATE | stopTime | TRIP014||STOP064 |  | 1 | 1 | 1 | 0 | 3.568 | 0.016 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP064.on |
| CREATE | stopTime | TRIP014||STOP065 |  | 1 | 1 | 1 | 0 | 3.478 | 0.015 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP065.on |
| CREATE | stopTime | TRIP014||STOP066 |  | 1 | 1 | 1 | 0 | 3.456 | 0.016 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP066.on |
| CREATE | stopTime | TRIP014||STOP067 |  | 1 | 1 | 1 | 0 | 3.443 | 0.014 | gtfs.idx.trips.n894456764.stopTimeMember.n894456764_0_STOP067.on |
| CREATE | stopTime | TRIP015||STOP068 |  | 1 | 1 | 1 | 0 | 3.454 | 0.015 | gtfs.idx.trips.n877679145.stopTimeMember.n877679145_0_STOP068.on |
| CREATE | stopTime | TRIP015||STOP069 |  | 1 | 1 | 1 | 0 | 5.776 | 0.017 | gtfs.idx.trips.n877679145.stopTimeMember.n877679145_0_STOP069.on |
| CREATE | stopTime | TRIP016||STOP070 |  | 1 | 1 | 1 | 0 | 3.385 | 0.016 | gtfs.idx.trips.n928012002.stopTimeMember.n928012002_0_STOP070.on |
| CREATE | stopTime | TRIP016||STOP071 |  | 1 | 1 | 1 | 0 | 3.480 | 0.016 | gtfs.idx.trips.n928012002.stopTimeMember.n928012002_0_STOP071.on |
| CREATE | stopTime | TRIP016||STOP072 |  | 1 | 1 | 1 | 0 | 3.555 | 0.016 | gtfs.idx.trips.n928012002.stopTimeMember.n928012002_0_STOP072.on |
| CREATE | stopTime | TRIP017||STOP073 |  | 1 | 1 | 1 | 0 | 3.554 | 0.016 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP073.on |
| CREATE | stopTime | TRIP017||STOP074 |  | 1 | 1 | 1 | 0 | 3.452 | 0.015 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP074.on |
| CREATE | stopTime | TRIP017||STOP075 |  | 1 | 1 | 1 | 0 | 3.466 | 0.015 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP075.on |
| CREATE | stopTime | TRIP017||STOP076 |  | 1 | 1 | 1 | 0 | 3.602 | 0.023 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP076.on |
| CREATE | stopTime | TRIP017||STOP077 |  | 1 | 1 | 1 | 0 | 3.422 | 0.015 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP077.on |
| CREATE | stopTime | TRIP017||STOP078 |  | 1 | 1 | 1 | 0 | 3.494 | 0.015 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP078.on |
| CREATE | stopTime | TRIP017||STOP079 |  | 1 | 1 | 1 | 0 | 3.607 | 0.020 | gtfs.idx.trips.n911234383.stopTimeMember.n911234383_0_STOP079.on |
| CREATE | stopTime | TRIP018||STOP080 |  | 1 | 1 | 1 | 0 | 3.320 | 0.015 | gtfs.idx.trips.n827346288.stopTimeMember.n827346288_0_STOP080.on |
| CREATE | stopTime | TRIP019||STOP081 |  | 1 | 1 | 1 | 0 | 3.714 | 0.016 | gtfs.idx.trips.n810568669.stopTimeMember.n810568669_0_STOP081.on |
| CREATE | stopTime | TRIP020||STOP082 |  | 1 | 1 | 1 | 0 | 3.598 | 0.017 | gtfs.idx.trips.n511593581.stopTimeMember.n511593581_0_STOP082.on |
| CREATE | stopTime | TRIP020||STOP083 |  | 1 | 1 | 1 | 0 | 3.478 | 0.015 | gtfs.idx.trips.n511593581.stopTimeMember.n511593581_0_STOP083.on |
