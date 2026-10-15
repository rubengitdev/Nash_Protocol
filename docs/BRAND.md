# Nash Protocol: Brand and Typography

> Tone: intelligent, insightful, authoritative, never impenetrable. Use real-world analogies to explain hard ideas. Be inclusive: this protocol is for everyone at the table, not only insiders.

## 1. Identity

| | |
| :--- | :--- |
| Name | **Nash Protocol** (short form: **Nash**) |
| Tagline | *Leverage, at equilibrium.* |
| Mark | The brushed-silver ribbon **N**: three parallel strands in dynamic balance. Source file: `Nash-Protocol-Logo.png` (transparent PNG). Derived assets live in `apps/web/public/brand/` |
| Image language | Futuristic, high quality, calm. The hero is two characters inside a ring of three silver ribbons (the same three strands as the mark): in front, Satoshi Nakamoto as a faceless hooded figure; behind and above, John Nash as a marble statue. See section 3 |

### Palette

| Token | Hex | Use |
| :--- | :--- | :--- |
| Abyss navy | `#050a18` | Page background (`--bg`) |
| Deep panel | `#0b1429` · `#0e1a33` · `#13244a` | Surfaces and hover states |
| Line | `#1a2a4d` | Hairlines and borders |
| Navy | `#0b1f4b` · `#1b3a8f` | Gradients, atmosphere |
| **Emerald** | `#2ee6a6` | The only accent: links, actions, "best response" italics (`--green` / `--emerald`) |
| Emerald soft / deep | `#7df2c8` · `#0a7a58` | Hover, glow / dark fills |
| **Silver** | `#b8c2d4` · `#dce3f0` | Secondary text, the logo's metal |
| **White** | `#eef2fa` | Primary text |
| Danger | `#d6153c` · `#ff5d73` | Liquidation and shock states only |

Emerald is used sparingly: if everything glows, nothing does. The variable is still called `--green` because that name predates the rebrand and 142 rules reference it.

### Logo rules

- Use the mark on navy or black only; the silver reads best against dark.
- Clear space equal to one strand width on every side.
- Wordmark: `NASH` in Montserrat 700, tracking `0.34em`, silver-light, over `PROTOCOL` in Montserrat 500, tracking `0.52em`, emerald.
- Never recolour the ribbon, add outlines, or place it on a busy photo.

## 2. Typography: the Equilibrium Stack

The brief asked for a clean modern sans (Montserrat or Roboto) and, separately, for typography drawn from John Nash's personality. The reference site (newt.foundation) sets its headlines in **GT Sectra**, a sharp editorial serif, with a sans for the interface. Nash Protocol keeps that structure and lets Nash decide the roles.

| Role | Family | Why it is Nash |
| :--- | :--- | :--- |
| **The Journal**: headlines, pull quotes, equations | **Newsreader** (variable, roman and italic) | Nash's best-known work is two pages. His PNAS paper, *Equilibrium points in n-person games* (1950), runs pp. 48 to 49 and his thesis is 28 pages. A journal serif says: this is an argument, made briefly. Free stand-in for GT Sectra's editorial character |
| **The Balance**: interface, labels, buttons, body | **Montserrat** (variable) | Geometric and even, like the mark. It is the voice of the product, not the argument. Brand guide named it |
| **The Machine**: numbers, addresses, data, the letter | **JetBrains Mono** | Cryptography and exact figures. Nash's 1955 NSA correspondence is about ciphers; the agency's replies were typed |
| **The Hand**: margin notes only | **Caveat** | Nash's NSA letters were handwritten, and in the 1970s he was "The Phantom of Fine Hall," scribbling arcane equations on blackboards at night. Used for short annotations, never body copy |

A fifth voice appears only in the hero's formulas: **Computer Modern** (KaTeX's fonts), the typeface of mathematics journals, so the equations look like the page of a paper. The first four are SIL Open Font License, self-hosted from `apps/web/public/fonts/` (no third-party request at runtime); KaTeX's fonts are bundled by the build and load only when the formulas render.

### Rules

1. **No single typeface dominates a screen.** Each plays its best response to the others, which is the equilibrium idea applied to layout. A headline may pair serif roman with serif *italic*; a label is sans caps; a figure is mono.
2. **Italic is the best response.** Set the word the sentence turns on in emerald italic: *Leverage, at **equilibrium.***
3. **Sentence case, short, ending in a period.** Headlines are statements ("Isolated by design."), borrowed from the reference site's rhythm.
4. **Numbered like a paper.** Sections are `§ 01 / THE ARGUMENT`, not `Section 1`.
5. **Math is real.** The Nash condition is typeset as `∀ i : uᵢ(s*) ≥ uᵢ(sᵢ, s*₋ᵢ)` in serif italic with proper subscripts.
6. **Tabular figures** (`tabular-nums`) for anything that changes: prices, LTV, counters.
7. **Hand-written notes are margin notes**: one short line, rotated a few degrees, emerald-soft, `aria-hidden`.

### Scale

| Level | Spec |
| :--- | :--- |
| Hero | Newsreader 360, `clamp(52px, 6.9vw, 112px)`, tracking `-0.035em`, line-height `0.94` |
| Section statement | Newsreader 340, `clamp(40px, 5.8vw, 92px)`, tracking `-0.03em` |
| Card title | Newsreader 380, 24 to 30 px |
| Body | Montserrat 400, 15.5 to 19 px, line-height 1.7 to 1.8 |
| Label | Montserrat 600, 11 to 12 px, uppercase, tracking `0.1em` to `0.2em` |
| Data | JetBrains Mono 500, 10.5 to 12 px, tracking `0.06em` to `0.14em` |

## 3. The hero: two characters and a blackboard

**Satoshi in front, no face.** A hooded figure whose face is a deep void under a thick, rolled hood. Nakamoto is a pseudonym: the idea has no face.

**Nash behind, a statue.** A marble bust in the classical manner, with a face, so the person behind the idea is present. It is a stylised sculpture, not a portrait or a likeness study. The lower bust dissolves into the dark, so the statue looms rather than competes. Satoshi is dark and matte; Nash is pale and veined: the two figures differ in value so each reads at a glance.

Both are carved in code: signed-distance fields blended smoothly, meshed once in a Web Worker (`figures.ts`, `sculpt.ts`), with ambient occlusion baked into vertex colour. There is no model or texture file. On phones the grid is coarser. The figures fade in when their mesh is ready, so the ring and the page never wait for them.

**The blackboard.** In the 1970s Nash was "The Phantom of Fine Hall," scribbling arcane equations on blackboards at night. The hero is that blackboard: formulas typeset in **Computer Modern** (via KaTeX, at build time, so the browser receives static HTML), silver for Nash, emerald for Nakamoto and the protocol. Each carries its source in the tag:

| Formula | Tag | Source |
| :--- | :--- | :--- |
| `∀i: uᵢ(sᵢ*, s*₋ᵢ) ≥ uᵢ(sᵢ, s*₋ᵢ)` | Nash equilibrium · 1950 | Nash, *Equilibrium points in n-person games*, PNAS 1950 |
| `σ* ∈ BR(σ*)` | a fixed point · 1950 | the same paper: an equilibrium is a fixed point of the best-response correspondence |
| `max (u₁(x)−d₁)(u₂(x)−d₂)` | the bargaining problem · 1950 | Nash, *The Bargaining Problem*, Econometrica 1950 |
| `T_attack(n): nᶜ ≪ eⁿ` | the attacker's effort · NSA, 1955 | Nash's letters contrast "a relatively small power of" the key length with exponential effort. They state nothing about the legitimate user's effort, so none is claimed |
| `SHA256²(h) < 2^(256−k)` | proof-of-work · 2008 | Nakamoto §4: a hash that "begins with a number of zero bits"; work is exponential in that number |
| `q_z = 1 if p ≤ q; (q/p)^z if p > q` | honest majority · §11 | Nakamoto §11, the attacker's catch-up probability (verified against the whitepaper text) |
| `x · y = k` | constant product · margin pool | the margin pool is a Uniswap V2 pair |
| `LTV = D/C ≤ LLTV`, `HF = C·LLTV/D > 1` | loan-to-value, health factor | this protocol |
| Payoff matrix (3,3 / 0,5 / 5,0 / 1,1) | prisoner's dilemma | the textbook example; the equilibrium cell (1,1) glows. "Change the rules, change the equilibrium" is the design brief |

The matrix is chosen on purpose: the equilibrium of the prisoner's dilemma is stable but not best. A protocol's job is to design the game so the stable outcome is also a good one.

To add or edit a formula, change the list in `scripts/render-formulas.mjs`, run it, and commit `formulas.generated.ts`.

## 4. Narrative

The site argues one idea at a time, in this order:

1. **The argument** (§ 01): a market holds when no one gains by breaking it. Three blocks: isolated by design, incentives that line up, leverage without the cliff.
2. **Products** (§ 02): borrow, earn, leverage.
3. **Isolation** (§ 03): an interactive board of hexagonal cells. Shock one cell and compare pooled lending (stress spreads) with Nash (it stays put). The board nods to Hex, the game Princeton students called "Nash."
4. **How it works** (§ 04).
5. **The letter** (§ 05): in 1955 Nash wrote by hand to the NSA about a cipher whose break-time grows exponentially with key length. He did not ask anyone to trust the machine; he asked them to do the math. So do we.
6. **Comparison, markets** (§ 06, § 07).
7. **Participate** (§ 08): four personas (DeFi day trader, yield seeker, newcomer, builder) and five principles (decentralized, transparent, resilient, efficient, accessible).
8. **The road** (§ 09): five phases.
9. **Details** (§ 10): FAQ, including an honest "Is leverage risky?".

### Claims policy

Every historical claim on the site was checked against a source (below). Anything that could not be confirmed was cut or softened, for example: Hex is described as a game Princeton students called "Nash," not as Nash's invention (Piet Hein created it in 1942 and Nash said he found it independently). Roadmap phases are labelled honestly (In progress / Planned); "Live" is reserved for a phase that is actually deployed, and nothing is deployed under the Nash name yet. Governance and staking are Phase IV, not live.

## 5. Sources

- John Forbes Nash Jr.: birth and death, Duffin's "He is a mathematical genius," the 28-page thesis, PNAS pp. 48 to 49, Nobel 1994, Abel 2015, "The Phantom of Fine Hall." <https://en.wikipedia.org/wiki/John_Forbes_Nash_Jr.>
- The 1955 NSA letters (handwritten by Nash; NSA replies typed; the quoted sentence "It means that it is quite feasible to design ciphers that are effectively unbreakable."). <https://gwern.net/doc/cs/cryptography/nash/1955-nash>
- Hex: Piet Hein 1942; Nash's independent claim; players called the game "Nash"; no draws. <https://en.wikipedia.org/wiki/Hex_(board_game)>
- *Ideal Money*, Southern Economic Journal 69(1), 4 to 11 (2002): money as a technology. <https://ideas.repec.org/a/wly/soecon/v69y2002i1p4-11.html>
- Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System* (2008), sections 4, 6 and 11: <https://bitcoin.org/bitcoin.pdf>
- Layout and type reference: <https://www.newt.foundation/> (GT Sectra serif plus sans, short sentence-case headings).

## 6. Where it lives in code

| Concern | File |
| :--- | :--- |
| Tokens and `@font-face` | `apps/web/src/app/globals.css` (head), `apps/web/tailwind.config.ts` |
| Landing styles | `apps/web/src/app/nash.css` |
| Hero 3D scene | `apps/web/src/components/nash/NashHeroScene.tsx` |
| The two characters | `figures.ts` (the fields), `sculpt.ts` (mesher), `figures.worker.ts` and `loadFigure.ts` (off the main thread) |
| Formulas | `HeroFormulas.tsx`, `formulas.generated.ts`, generated by `scripts/render-formulas.mjs` |
| Sections | `apps/web/src/components/nash/*` |
| Metadata and OG image | `apps/web/src/app/layout.tsx`, `apps/web/public/og.png` |
