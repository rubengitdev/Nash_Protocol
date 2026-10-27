# Nash Protocol: Brand and Typography

> Tone: intelligent, insightful, authoritative, never impenetrable. Use real-world analogies to explain hard ideas. Be inclusive: this protocol is for everyone at the table, not only insiders.

## 0. Current design system: dark by default

The site follows <https://www.newt.foundation/>: a bone ground, coal ink, hairline borders, a monospace display face and a 3D glyph ribbon. It ships two themes on one set of tokens. **Dark is the default** (since October 2026; `data-theme="dark"` is rendered on `<html>`); the OS colour scheme is deliberately not consulted. A toggle in the header switches to light and remembers the choice (`localStorage` key `nash-theme`; a script in `<head>` applies it before first paint, so there is no flash).

### Tokens

One source: `apps/web/src/app/globals.css` (CSS variables on `:root` for light and `:root[data-theme="dark"]`), mirrored by `apps/web/tailwind.config.ts`, where every colour is a CSS variable with opacity support (`bg-go/15`, `border-ink/10`).

| Role | Light | Dark | Class / variable |
| :--- | :--- | :--- | :--- |
| Page | `#fefdf9` (bone) | `#010101` (coal) | `bg-page`, `--bg` |
| Panels | `#f9f8f4` `#f4f3ef` `#ebeae6` | `#101010` `#151515` `#1c1c1c` | `bg-panel`, `bg-panel-subtle`, `bg-panel-hover` |
| Hairlines | `#e5e4e0` (10% ink) | `#262626` | `border-line`, `border-line-soft`, `border-line-strong` |
| Text | `#010101` | `#fefdf9` | `text-fg`, `text-ink` (strongest), `text-fg-2`, `text-fg-3` |
| Secondary text | `#656462` (60% ink) | `#8d8d8d` | `text-muted`, `text-dim` (faintest, 3.9:1: never for anything that must be read) |
| Every button | black, bone label, 1px black border | bone, black label, 1px bone border | `--btn-bg`, `--btn-fg`, `--btn-border` (see Interaction) |
| Accent (selected, links) | `#010101` | `#e5e5e5` | `--accent` (also `--green`, `--emerald`: legacy names) |
| Good / go / long | `#087a50` | `#2ee6a6` | `text-go`, `bg-go/15` |
| Loss / short / danger | `#c8102e` | `#ff6b6b` | `text-neg`, `bg-neg-strong` |
| Caution | `#9a5b00` | `#f5a623` | `text-warn` |
| Sand (shader speckle) | `#d6b376` | `#d6b376` | `--sand` |

**Colour is meaning.** Green is good or long, red is loss or short, amber is caution. Every button wears one skin: the opposite of its surface, so black on the light theme and bone on the dark theme, with a 1px border in its own colour (Open App and Connect Wallet included). Long and Short submit buttons keep their green and red because they carry direction. Selected tabs use the accent (`bg-accent text-on-accent`). Do not hard-code hex in components: use a token, or the role is lost in one theme. Canvas libraries cannot read CSS variables, so they carry a per-theme palette (`TradingViewChart.tsx`).

### Type

| Role | Family |
| :--- | :--- |
| Section titles, card titles, numbers in display | **Space Mono** 400/700, italic included (`font-display`, `--display`) |
| H1/H2 and the header/footer wordmark | Arial bold, H1/H2 uppercase (`--font-heading`, `typography.css`) |
| Nav links and button labels | Menlo, uppercase (`--font-ui`) |
| Interface and body | **Inter** variable (`font-sans`, `--body`) |
| Data, addresses | JetBrains Mono (`font-mono`) |

All three are SIL OFL and self-hosted in `apps/web/public/fonts/`. Hero H1 is 64px bold, section H2 40px regular, body 14px with 0.28px tracking, as on the reference.

### Layout and chrome

- 1440px container, 24px gutter, 80px fixed header (hairline appears on scroll), 2px radius everywhere.
- **Logo**: the silver N mark on a black tile (`BrandMark` in `components/navigation.tsx`) beside the wordmark "Nash Protocol" in Arial bold, the same face as the H1/H2 headlines (`.brand-name`). The mark is only ever placed on black.
- **Footer** is always the inverse theme (`.theme-inverse` re-declares the tokens): black on light, bone on dark.
- **Header.** Landing: logo, CA chip ("Coming soon" until `NEXT_PUBLIC_TOKEN_CA` is set), network switch, Open App, Connect Wallet, theme toggle; no page links. App: logo, the eight page links, network switch, Connect Wallet, theme toggle. The switch is Mainnet | Testnet: the network is fixed per deployment (`NETWORK_MODE`), so the current side is a status label and the other side opens the same page on the other deployment (`/markets` when the page is hidden on mainnet).
- **Landing page:** hero (infinity ribbon, headline, two buttons; no captions), Features (a ribbon stage above six clickable cards), How it works (four figures), Smart contracts (`#contracts`, core contracts only, with a View all button), closing banner (three silver ribbons on a black panel, Open App). `/docs` holds the user-facing documentation, `/faq` the FAQ and `/contracts` every smart contract. The footer carries the CA, a Docs link and a Smart contracts link (to `/contracts`).
- **Smart contracts** (`LandingContracts.tsx` on the landing, `/contracts` page, both rendered with `ContractDirectory.tsx`; data from `lib/contract-directory.ts`): the landing shows only the Core protocol group and a "View all N contracts" button; `/contracts` lists every contract the app uses on the build's network, grouped as Core protocol, one group per stock market and Pons, each row with the full address, a copy button and a Blockscout link (`EXPLORER_URL/address/...`). It is built from the same env the app runs on (`PROTOCOL_ADDRESSES`, `MARKET_DEPLOYMENTS_JSON`, `PONS_DEPLOYMENT_JSON`), so testnet and mainnet each list their own contracts and the list cannot drift from what the app calls. An address is listed once.
- **Closing banner motion** (`LandingBanner.tsx`): the three ribbons draw in from the left the first time the banner is seen, then drift slowly with a glint running along each band; paused off screen, static with reduced motion or without JavaScript.

### The 3D glyph field

The reference's "3D" is not a mesh. It stacks text rows; each row places a few block characters (light shade to solid) at sine offsets, and a silhouette profile sets the width. The result reads as a twisting ribbon. The pointer widens the rows near it, the hero grows in over about 2.2s, and with `prefers-reduced-motion` every field renders one still frame.

**How it is drawn (and why it is cheap).** `layoutCells()` in `glyphEngine.ts` works out where each cell sits on the CPU (a few thousand cells, well under a millisecond) and uploads one `(x, y, shade)` per cell. One shared WebGL2 context then draws every cell as an instanced quad, so the GPU work follows the number of cells, not the number of pixels times columns (an earlier per-pixel shader looped over every column for every pixel and made the hero lag on integrated GPUs). Around that:

- fields are capped at about 1.5M pixels and drawn at 30 fps;
- while the page scrolls, and while the header focus veil is up, the fields hold their last frame (a field that has never been painted still gets its first);
- the loop sleeps when nothing is animating, and off-screen or hidden fields are not drawn;
- if frames arrive late the fields step down in resolution, then frame rate, and climb back after a calm spell;
- pointer widening only uses the room each row has left inside the canvas (a smooth limit in `layoutCells`), so a ribbon that already spans the full width swells where it can and is never cut off at the edge; the rest shape is unchanged;
- the header carries no `backdrop-filter`, because it would re-blur the animated hero on every frame.

Measure changes with Chrome on a real GPU (`--use-angle=gl --enable-gpu`); software GL (swiftshader) exaggerates compositing cost and says little about real machines.

Shapes (`GlyphShape`): `diamond`, `hourglass`, `cone`, `infinity` (a horizontal lemniscate; four strands per row, one on each branch of the curve), `strands`, `bands`, `spiral`, `blocks`, `opposing`, `wave`, `logo` (the Nash N: two stems and three bands at the logo's proportion, see `logoSpan` in `glyphEngine.ts`), and the feature silhouettes `lock`, `arrows`, `pagoda`, `curve`, `shield`, `candles`, `ring`, `bars` (defined as parts on a 1-tall frame in `glyphFigures.ts`; each row sweeps a full sine turn of cells across every part it crosses, so the outline stays readable while the shade twists inside it, as in the N). Where they are used:

| Place | Figure |
| :--- | :--- |
| Landing hero | `infinity`, as wide as the header content (the canvas is `.landing-hero-field`, inset to the page container, so its edges line up with the logo and the right-hand controls at every width; `mag` is set so the outer strand reaches about 1% short of each edge). The canvas starts below the header, and when it is too short for the 2:1 figure the engine scales the whole figure down (`INFINITY_FIT`, 92% of the height), so it is never cut by the header or the screen edge. The hero is `100svh`, so a phone's address bar does not resize it. On phones the copy comes first and the ribbon fills the space beneath it |
| Landing Features stage (card emblems use the same shape) | `logo` Earn (the Nash N), `lock` Lending (a padlock with keyhole: collateral sealed in its own market), `arrows` Trade (long up, short down, twisting opposite ways), `pagoda` China Equities (three tiered roofs), `curve` Pons (the bonding curve on its axes), `shield` Auto-Protect (a shield with a check cut through it). Changing card calls `morphKey`: the figure collapses to a stub and regrows |
| Landing How it works | `cone`, `opposing`, `diamond`, `hourglass`, solid (no sand speckle) |
| App pages (`AppPage` `banner` prop: a frameless ribbon beside the page title; `PageRibbon compact` is the thin strip on the Pons trade workspace) | Each feature page uses its Features-stage figure: Earn `logo`, Lending `lock`, Trade `arrows` (compact strip on the workspace too), China `pagoda`, Pons `curve`. The rest: Markets and a market's page `candles` (a rising run of price candles), Portfolio `ring` (an allocation ring in three slices), Analytics `bars` (a bar chart on its baseline). `/contracts` has no ribbon |

| Piece | File |
| :--- | :--- |
| Presets (hero, banners, heading ribbons, stage, steps, emblems) | `apps/web/src/components/glyph/glyphPresets.ts` |
| Shared renderer: one WebGL2 context drawn into every canvas | `.../glyph/glyphEngine.ts` |
| React wrapper (`morphKey`, `interactive`) | `.../glyph/GlyphField.tsx` |
| Landing sections | `apps/web/src/components/landing/` |
| Ribbon on feature pages, card emblems | `apps/web/src/components/PageRibbon.tsx`, `Emblem.tsx` |

Tune a preset with its comments: `cols`, `mag`, `freqX`, `freqY`, `density`, `height`, `lean`, `centerY`, `compact`.

### Interaction

All of it is CSS under "Round 2" in `globals.css`, plus `ButtonFx.tsx` (the click ripple).

- **Buttons.** One skin for `.btn-action`, `.btn-silver`, `.btn-ghost`, `.landing-btn`, `.app-button`, `.launch` (class names are historical): black on a light surface or bone on a dark surface (the opposite of the surface it sits on, so the black closing banner always carries the bone button) with a 1px border in its own colour and a 2px radius. Outline variants (`.app-button.secondary`, `.btn-ghost`, `.landing-btn-outline`) differ only in a softer border. Hover shows a faint tint, a glass flare sweeping across and a firmer border; press shows a ripple from the click point (`ButtonFx.tsx`). **Nothing moves**: no translate, scale or rolling label on hover or press. Tokens: `--btn-bg`, `--btn-bg-hover`, `--btn-fg`, `--btn-border`, `--btn-border-soft`, `--btn-flare`, `--btn-ripple`. Do not add a new button style; use one of these classes.
- **Fields.** Inputs, selects and textareas inside `.app-page` keep the colour of the surface (white on light, black on dark; `--field-*` tokens, not the button tokens), with a soft border that firms on focus and a custom chevron on selects.
- **Cards** (`.fx-card`): on hover or focus an ASCII border (░▒▓█ tiles on a 4px ring, drawn with a mask, no extra DOM) marches around the edge and the flare sweeps across. Add the class to a card; do not use it on an element that already uses `::before` or `::after`.
- **Nav focus.** Hovering or keyboard-focusing a header link blurs the page behind a veil (`.nav-veil`, an overlay, so fixed dialogs keep their position) and softens the other header items. Off on touch screens.
- **Smooth scroll.** Lenis, on the landing page only (`LandingScroll`); app pages keep native scroll because their tables, charts and dialogs scroll on their own.
- **Signature elements** (what makes the pages Nash and not a template):
  - *Heading ribbon*: every feature page's heading is two columns, title left and a frameless ribbon right (fading at top and bottom), under a rule made of the ASCII dither that fades out to the right. Page content shares the header's 24px gutter, so everything aligns to the logo edge.
  - *Emblems* (`Emblem.tsx`): a small ribbon in a hairline frame signs a card with its feature's shape (landing Features cards use them instead of stock icons; empty and error states use an hourglass). It is a still frame and drifts only while the card is hovered or focused, so it costs nothing at rest. Put it inside an `.fx-card` or any `[data-glyph-host]`.
- **Reduced motion.** No flare, ripple, march, veil blur, Lenis or shader animation; hover colour changes stay.

> Sections 1 to 4 below document the previous black-field design (hooded figure, Newsreader, Montserrat, silver on black). The landing no longer uses it. The components are kept in `apps/web/src/components/nash/` and are unused, as are the old hero scene and its `three` / `katex` / `ogl` dependencies, which can be deleted when no longer wanted (`lenis` is used again by the landing page).

## 1. Identity (legacy palette and hero; name, tagline and mark are current)

| | |
| :--- | :--- |
| Name | **Nash Protocol** (short form: **Nash**) |
| Tagline | *Leverage, at equilibrium.* |
| Mark | The brushed-silver ribbon **N**: three parallel strands in dynamic balance. Source file: `Nash-Protocol-Logo.png` (transparent PNG). Derived assets live in `apps/web/public/brand/` |
| Image language | Futuristic, high quality, calm. The hero is Satoshi Nakamoto as a large faceless hooded figure inside an oversized ring of three silver ribbons (the same three strands as the mark), with Nash present as a blackboard of formulas. See section 3 |

### Palette

Taken from the brand banner (`nash-X-banner.png`): a black field, brushed-steel ribbons, white type. The brand itself has no hue. One green and the status colours appear only where they mean something.

| Token | Hex | Use |
| :--- | :--- | :--- |
| **Black** | `#000000` | Page background (`--bg`), the banner's field |
| Graphite | `#0a0a0a` · `#101010` · `#151515` · `#1c1c1c` | Raised sections, panels, hover states (`--bg-raised`, `--panel`, `--panel-subtle`, `--panel-hover`) |
| Line | `#262626` | Hairlines and borders (`--line`) |
| **Steel** | `#e5e5e5` | The accent: actions, links, italics, highlights (`--green` / `--emerald`; see the note below) |
| Steel soft / deep | `#ffffff` · `#6d6d6d` | Hover, glow / dark fills |
| **Silver** | `#c4c4c4` · `#e5e5e5` | The logo's metal, secondary highlights (`--silver`, `--silver-light`) |
| **Grey** | `#8d8d8d` | Secondary text (`--muted`), the grey of "Leverage, at" in the banner |
| **White** | `#f5f5f5` | Primary text (`--text`) |
| **Go green** | `#2ee6a6` · `#7df2c8` · `#14b07f` | Actions that commit funds, and good states (`--go`, `--go-soft`, `--go-deep`; Tailwind `go-*`) |
| Danger | `#d6153c` · `#ff5d73` | Liquidation, losses and shock states |
| Warning | `#f5a623` | Stale or at-risk states |

### Where green is used

Green is a signal, not decoration. The rule: **green means "go" or "good"**. If an element is neither, it stays steel.

| Role | Examples | Why green |
| :--- | :--- | :--- |
| Primary action that commits funds or starts the flow | Connect wallet, Explore/Launch app, Deposit, Borrow, Open Long, Confirm, Approve, Submit in the China and Pons panels (`.app-button`, `.nash-btn-primary`, `.launch`, `bg-go`) | One obvious next step on each screen |
| Long / deposit side of a pair | the Long tab, the Deposit tab, Auto-Protect "enabled" | The affirmative side; the opposite (Short) is red |
| Good state | live dots, "Healthy", "Active", market session open, confirmed transaction banners, safe health factor and LTV, liquidation buffer, a gain (`.pons-positive`, green PnL and 24h change) | Reads at a glance, like a status light |
| Safe region in a figure | the safe set and the guarded health factor on the How it works board | Safe against unsafe (red) |

Stays steel, on purpose: navigation, links, headings and italics, selected filters and tabs (a selection is neutral), leverage steps, MAX buttons, the logo, badges, focus rings, and every secondary or "ghost" button. Losses and danger are red, warnings are amber. A selected tab that is not a side or an action uses white-on-black, never green.

The accent variables are still called `--green` and `--emerald` (and Tailwind's `emerald-*` and `brand-*`) because those names predate the palette and several hundred rules reference them. They resolve to steel; green has its own tokens (`--go*`, `go-*`). `apps/web/src/app/globals.css` holds the single token source; Tailwind mirrors it in `apps/web/tailwind.config.ts`.

### Logo rules

- Use the mark on black only; the silver reads best against the banner's field. On the light site it sits on a black tile.
- Clear space equal to one strand width on every side.
- Wordmark: `NASH` in Montserrat 700, tracking `0.34em`, silver-light, over `PROTOCOL` in Montserrat 500, tracking `0.52em`, steel.
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
2. **Italic is the best response.** Set the word the sentence turns on in steel italic: *Leverage, at **equilibrium.***
3. **Sentence case, short, ending in a period.** Headlines are statements ("Isolated by design."), borrowed from the reference site's rhythm.
4. **Numbered like a paper.** Sections are `§ 01 / THE ARGUMENT`, not `Section 1`.
5. **Math is real.** The Nash condition is typeset as `∀ i : uᵢ(s*) ≥ uᵢ(sᵢ, s*₋ᵢ)` in serif italic with proper subscripts.
6. **Tabular figures** (`tabular-nums`) for anything that changes: prices, LTV, counters.
7. **Hand-written notes are margin notes**: one short line, rotated a few degrees, white, `aria-hidden`.

### Scale

| Level | Spec |
| :--- | :--- |
| Hero | Newsreader 360, `clamp(52px, 6.9vw, 112px)`, tracking `-0.035em`, line-height `0.94` |
| Section statement | Newsreader 340, `clamp(40px, 5.8vw, 92px)`, tracking `-0.03em` |
| Card title | Newsreader 380, 24 to 30 px |
| Body | Montserrat 400, 15.5 to 19 px, line-height 1.7 to 1.8 |
| Label | Montserrat 600, 11 to 12 px, uppercase, tracking `0.1em` to `0.2em` |
| Data | JetBrains Mono 500, 10.5 to 12 px, tracking `0.06em` to `0.14em` |

## 3. The hero: a figure and a blackboard

**Satoshi, no face.** A hooded figure whose face is a deep void under a thick, rolled hood. Nakamoto is a pseudonym: the idea has no face. The figure fills the ring, turned slightly toward the headline, dark and matte so the ring and the formulas carry the light. The ring is drawn larger than the frame on purpose and runs off the top and bottom of the hero.

The figure is carved in code: a signed-distance field blended smoothly, meshed once in a Web Worker (`figures.ts`, `sculpt.ts`), with ambient occlusion baked into vertex colour. There is no model or texture file. On phones the grid is coarser. The figure fades in when its mesh is ready, so the ring and the page never wait for it.

(An earlier version had a marble bust of Nash behind Satoshi. It was dropped: the formulas already carry Nash, and one figure reads more clearly.)

**The blackboard.** In the 1970s Nash was "The Phantom of Fine Hall," scribbling arcane equations on blackboards at night. The hero is that blackboard: formulas typeset in **Computer Modern** (via KaTeX, at build time, so the browser receives static HTML), silver for Nash, white for Nakamoto. Each carries its source in the tag:

| Formula | Tag | Source |
| :--- | :--- | :--- |
| `∀i: uᵢ(sᵢ*, s*₋ᵢ) ≥ uᵢ(sᵢ, s*₋ᵢ)` | Nash equilibrium · 1950 | Nash, *Equilibrium points in n-person games*, PNAS 1950 |
| `σ* ∈ BR(σ*)` | a fixed point · 1950 | the same paper: an equilibrium is a fixed point of the best-response correspondence |
| `max (u₁(x)−d₁)(u₂(x)−d₂)` | the bargaining problem · 1950 | Nash, *The Bargaining Problem*, Econometrica 1950 |
| `T_attack(n): nᶜ ≪ eⁿ` | the attacker's effort · NSA, 1955 | Nash's letters contrast "a relatively small power of" the key length with exponential effort. They state nothing about the legitimate user's effort, so none is claimed |
| `SHA256²(h) < 2^(256−k)` | proof-of-work · 2008 | Nakamoto §4: a hash that "begins with a number of zero bits"; work is exponential in that number |
| `q_z = 1 if p ≤ q; (q/p)^z if p > q` | honest majority · §11 | Nakamoto §11, the attacker's catch-up probability (verified against the whitepaper text) |


To add or edit a formula, change the list in `scripts/render-formulas.mjs`, run it, and commit `formulas.generated.ts`.

### The "How it works" board

The section keeps its three steps (Deposit, Borrow or trade, Auto-Protect) but is drawn as an instrument board, in the same blueprint language: a plot with a grid, axes and registration marks, and a side panel with a typeset formula, animated readouts and a one-line note. It is SVG driven by one clock, with no WebGL, and it pauses off screen. All numbers are illustrative and labelled so on the figure.

| Step | Figure | The idea from Nash |
| :--- | :--- | :--- |
| Deposit | Collateral C against debt D. The line D = LLTV·C splits the plane; the safe set `S` grows with the deposit | A strategy set that is convex and closed, the kind Nash's 1950 existence proof works on |
| Borrow or trade | A point inside `S`, its health factor, and a Long/Short payoff chart at 2× | A strategy is a side and a size; the rules decide the payoff |
| Auto-Protect | Health factor over a falling price. The guard trims twice, each time returning the position to HF 1.30; the same position without a guard crosses 1.00 | A fixed point: after every shock the position returns to where it was safe |

The step 3 curve is a deterministic simulation in `HowItWorksBoard.tsx` (`simulate`), using the real health-factor formula; the guard thresholds there (1.15 to act, 1.30 to return) are illustration values, not protocol parameters.

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
| Landing sections | `apps/web/src/components/landing/` (current); `apps/web/src/app/nash.css` styles the legacy sections |
| 3D glyph field | `apps/web/src/components/glyph/` |
| Theme provider, toggle | `apps/web/src/providers/ThemeProvider.tsx`, `apps/web/src/components/ThemeToggle.tsx` |
| Header, footer, mobile drawer | `apps/web/src/components/Header.tsx`, `Footer.tsx`, `MobileNavigation.tsx`, `navigation.tsx` |
| Network switch, CA chip | `apps/web/src/components/NetworkBadge.tsx`, `CaChip.tsx` |
| Click ripple, smooth scroll | `apps/web/src/components/ButtonFx.tsx`, `landing/LandingScroll.tsx` |
| Docs page | `apps/web/src/app/docs/page.tsx` (copy restates text already on the site; add nothing the product does not say) |
| Legacy hero 3D scene (unused) | `apps/web/src/components/nash/NashHeroScene.tsx` |
| The figure | `figures.ts` (the field), `sculpt.ts` (mesher), `figures.worker.ts` and `loadFigure.ts` (off the main thread) |
| Formulas | `HeroFormulas.tsx`, `formulas.generated.ts`, generated by `scripts/render-formulas.mjs` |
| Sections | `apps/web/src/components/nash/*` |
| Metadata and OG image | `apps/web/src/app/layout.tsx`, `apps/web/public/og.png` |
