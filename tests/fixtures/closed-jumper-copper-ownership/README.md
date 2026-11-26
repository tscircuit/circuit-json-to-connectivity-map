# Closed jumper copper ownership

The source declarations and PCB geometry were captured from core commit
`292fed088ffeb82478ca38c0dd0b4f414de73a4a` using:

```tsx
<board width={10} height={7} routingDisabled schematicDisabled>
  <solderjumper
    name="JP1"
    footprint="solderjumper2_bridged12"
    bridgedPins={[["1", "2"]]}
    pcbX={-1.27}
  />
  <trace from="JP1.pin1" to="net.SIG" />
</board>
```

Only source records, PCB geometry, and silkscreen are retained. Native PCB notes
identify the declared SIG connection; the test adds a note showing the actual
map result. The captured footprint geometry is unchanged.

The pads are intentionally connected by the declared internal connection and
by the footprint's copper bridge. The bug leaves that bridge unassigned even
though both pads belong to SIG, causing downstream false short reports.
