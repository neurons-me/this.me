# Memory

In `.me`, **Memory** is the canonical event unit of the runtime.

- Preferred API: `me.memories`
- Preferred inspect field: `me.inspect().memories`
- Preferred replay API: `me.replayMemories(memories)`

### Quick example

```ts
const state = me.inspect();
console.log(state.memories.length);

const snapshot = me.exportSnapshot();
const me2 = new Me();
me2.replayMemories(snapshot.memories);
```
