# BitBurner: Eldritch Edition

Larandar's BitBurner scripts

## What is [BitBurner](https://github.com/bitburner-official/bitburner-src)?

Bitburner is a programming-based [incremental game](https://en.wikipedia.org/wiki/Incremental_game)
that revolves around hacking and cyberpunk themes.

The game can be played at <https://danielyxie.github.io/bitburner> or installed through
[Steam](https://store.steampowered.com/app/1812820/Bitburner/).

## The Mythos: top-level interface

You might ask: "What the hell are those script's names?"

- First, any decent hacker needs to use esoteric names, and the ones from this repository come from
  [The Cthulhu Mythos](https://www.wikiwand.com/en/Cthulhu_Mythos).
- Second, why would anyone use boring names without a common thematic if they don't have to write
  documentation? Certainly not me; I don't even write documentation 🚀

```tree
├── cthulhu.ts                    # Entrypoint, survey and whisper the cult's scheming
└── zvilpogghua.ts                # Orchestrate the corruption and sacrifices
```

### Aliases

```shell
alias cthulhu="home; killall; clear; run /cthulhu.js"
alias darkweb-shopping="home; connect darkweb; buy -l; buy BruteSSH.exe; buy FTPCrack.exe; buy relaySMTP.exe; buy HTTPWorm.exe; buy SQLInject.exe; buy ServerProfiler.exe; buy DeepscanV1.exe; buy DeepscanV2.exe; buy AutoLink.exe; buy Formulas.exe; home"
```

### Cthulhu

> The great old one will spread the corruption

The great one, his role is to wake up from time to time and survey that everything is according to
plan, and delegate any work needed.

### Zvilpogghua

> The feaster of star will devour all

The feaster will orchestrate the corruption and sacrifices, in charge only of scheduling them,
discovery and scoring is not their concern.

## The cult: submodules

```tree
├── _ceremonies/**                # Background tasks for the cult
├── _corruptions/**               # Scripts to deploy/hack servers
└── _necronomicon/**              # Helpers accross modules
```

### Necronomicon: forbidden knowledge and cult facilitators

```tree
├── forbidden_knowledge.ts        # Constants
├── keeper.ts                     # Save informations for reusing between services
├── name-giver.ts                 # Naming utilities
└── whisperer.ts                  # Logging
```

## Connect your cult to your BitNode

Fetch the NS definitions and start compilation watcher

```shell
npm install --include-dev         # Install dependencies
npm run dev                       # Run dev builder
```

In BitBurner go to:

- **Options** > **Remote API**
- Set **Port** to `42069`, then **Connect**

## Exploits solutions

Solutions to the `SF-1` achievements, names and descriptions are located in
<https://github.com/bitburner-official/bitburner-src/blob/dev/src/Exploits/Exploit.ts>, and give
clues for each of them. You can also use the GitHub search feature for the token `Exploit.N00dles`
(for example).

Concider this your **SPOILER ALERT**, if you are still curious see [EXPLOITS.md]([EXPLOITS.md).

## Extension Recommendations

- [auto-snippet](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.auto-snippet):
  automate inserting the file template in `.vscode/snippets.code-snippets`

## References

- NS documentation [bitburner-official/bitburner-src](https://github.com/bitburner-official/bitburner-src/blob/dev/markdown/bitburner.ns.md)
- This implementation is an improvement of my previous scripts [bitburner-corrupted](https://github.com/laradar/bitburner-corrupted)
- Based on a mix of:
  - [bitburner-official/vscode-template](https://github.com/bitburner-official/vscode-template)
  - [bitburner-official/typescript-template](https://github.com/bitburner-official/typescript-template)
  - [bitburner-official/bitburner-filesync](https://github.com/bitburner-official/bitburner-filesync)
