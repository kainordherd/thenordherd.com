---
title: The Stack Doesn't Care
pubDate: '2026-02-21'
---

There’s a particular kind of excitement that seizes otherwise reasonable people when a new technology appears to dissolve complexity. Suddenly, the old infrastructure - compilers, operating systems, APIs - becomes vestigial. Unnecessary. A relic of an era when humans had to speak precisely to machines.

I understand the excitement. Watch Claude Code scaffold an entire project from a single sentence, and it’s hard not to feel like something fundamental has shifted. Open Cursor, describe what you want in plain language, and the editor starts to feel less like a tool and more like a collaborator. Run Codex CLI and ask it to refactor your codebase; it does, competently, without complaint.

So I understand why people start asking: what exactly is a compiler for, now?

The answer, unfortunately for the narrative, hasn’t changed.

The claim that AI voice interfaces will replace operating systems is the most spectacular of these. The argument, roughly stated, goes like this: if you can tell your computer what to do in natural language, the OS - with its permission systems, process schedulers, memory managers - becomes unnecessary overhead. Bureaucracy, we’re finally free from.

But ask the obvious question. What is the voice agent running on?

The scheduler allocates CPU time to the model. The memory manager is allocating the context window. The filesystem storing the conversation history. The network stack is delivering the API call. None of these has been dissolved by the intelligence sitting atop them. They’ve been hidden, which is a completely different thing. iOS hid the filesystem from users; the filesystem didn’t disappear - it became someone else’s problem.

What these people are describing isn’t the replacement of an operating system. It’s a new shell. A more capable, more conversational shell, which is genuinely interesting and genuinely worth building. But a shell nonetheless. The OS was always underneath the shell. Putting a nicer door on a building doesn’t relocate the foundation.

The compiler argument is subtler and, to its credit, more interesting. LLMs generate code. Often good code. Sometimes, better code than the person asking for it would have written. If the model goes from intent to working program, where exactly does the compiler fit?

Here’s where it falls apart: the compiler isn’t for humans. It never was. It’s a translation layer between symbolic logic and machine behaviour, and none of this has touched that translation problem. Claude Code outputs Python. Python gets interpreted. CPython, itself compiled from C, manages the runtime. The code executes on an ISA that the model has never seen. The stack is as deep as it ever was; the model writes closer to the top.

When Claude Code produces a program with a subtle concurrency bug - and it does, I’ve watched it happen - the compiler doesn’t apologise and patch things up. The runtime doesn’t. Something crashes, or silently misbehaves, and suddenly the debugging tools, the type systems, the sanitisers, the profilers all rush back into view. All the supposedly obsolete infrastructure becomes immediately relevant.

Error conditions are revealing. People who argue that AI eliminates infrastructure almost always describe the happy path. When everything works, the layers beneath an LLM’s output are easy to forget. When it fails, they’re all you think about. Good engineering has always been mostly about the unhappy path. That hasn’t changed, and neither has the stack underneath.

None of this is new, which is worth noting in itself.

In the 1960s, COBOL was marketed, in part, as a way for business managers to write programs in something resembling plain English. The programmers would become unnecessary. The programmers did not become unnecessary; their numbers grew steadily for sixty more years. In the 1990s, visual programming environments were going to end the era of writing code by hand. They didn’t - they added another layer to the toolbox, and the toolbox grew. When cloud computing arrived, operations engineers were declared obsolete. DevOps appeared instead, inheriting all the old problems plus several exciting new ones.

The pattern is consistent enough to merit a name. Each time a layer of abstraction becomes more accessible, demand for the underlying infrastructure - and for people who understand it - increases, not decreases. Dijkstra noticed something like this. So did others. It doesn’t seem to stop the predictions.

It’s worth asking who is making these arguments, and what they’re optimising for.

Venture-backed AI companies need a narrative that justifies large valuations. ‘AI is a powerful new developer tool’ is a fine product. ‘AI eliminates entire categories of infrastructure’ is a platform play, a paradigm shift, something that warrants a very different kind of investment. The incentive to overclaim is structural, not malicious. Nobody in a pitch meeting is lying, exactly. They’re selecting the most expansive version of a story that might, in some narrow reading, be true.

Technology journalists, operating in an attention economy, face the same pressure from the opposite direction. A nuanced take about the accumulation of abstraction layers doesn’t spread. ‘The compiler is dead’ spreads.

The result is a discourse that consistently overstates displacement and understates accumulation. And the people most harmed by it are the ones who actually build things - developers who internalise the wrong mental model and then wonder why their ‘AI-native’ system is mysteriously difficult to debug.

What Cursor, Claude Code, and Codex CLI actually represent is significant. The top of the stack got dramatically more capable. Expressing intent in natural language and receiving a reasonable implementation are real shifts. The pool of people who can participate in software development grows. The leverage of people who already understand the stack gets larger. That’s nothing - that’s genuinely a lot.

But the stack is still there.

CAP theorem doesn’t care how eloquent your prompt was. Memory is still finite. Networks still have latency. Race conditions don’t resolve themselves because AI generated the code that introduced them. The compiler is still translating your symbols into something a CPU can execute, and the CPU still follows its instruction set. The instruction set still reflects decisions made by engineers at Intel and ARM decades before any of these models existed.

Abstraction layers accumulate. They do not evaporate.

People who claim otherwise are usually trying to sell you something. Or they’re excited, which is more forgivable - but in either case, the stack doesn’t care.
