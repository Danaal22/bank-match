---
name: Interrupted tool recovery
description: Source persistence checks after a disconnected tool session
---

After a tool reports a server disconnect, verify that earlier source edits are still present before attributing missing generated types to the compiler.

**Why:** In this workspace, an interrupted session left earlier contract/schema edits absent while later edits remained. Regenerating from the restored older contract repeated the same type failures.

**How to apply:** Compare the current canonical source with the intended change after recovery. Do not assume every earlier successful edit survived an interrupted session.
