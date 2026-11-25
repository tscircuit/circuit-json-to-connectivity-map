# NEMA8 intended connectivity regression

The gzip contains the complete, unchanged Circuit JSON for
[ShiboSoftwareDev/nema8-20mm-dual-usbc-stepper-controller](https://tscircuit.com/ShiboSoftwareDev/nema8-20mm-dual-usbc-stepper-controller)
v1.0.48, also used by tscircuit/core#5757 and tscircuit/check-shorts#81.

The uncompressed fixture has 2,469 elements and is 1,473,700 bytes. Its SHA-256
is `32f2eaaa2d3878ec108a9f8789e857d26a17b4bebeddd2d4aabfb1d923c373c1`.

`source_port_155` is C_VM_HF1.pin1 on VM. `source_port_150` is D_VM_TVS.pin2
on GND. The saved PCB route owned by `source_trace_8` ends at `pcb_port_150`.
The source map keeps these nets separate, but the full map merges them through
that PCB endpoint. That lets a downstream shorts checker treat the bridge as
an intended connection.

The separate `nema8-tvs-sample` fixture produces the native PCB snapshot used
in the PR. This full-board case preserves the original capture as an additional
regression check.
