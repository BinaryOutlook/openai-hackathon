# Design System Inspiration of Shrimp

## 1. Visual Theme & Atmosphere

Shrimp's visual system should feel like a lively marketplace host: approachable, honest, resourceful, and quietly energetic. The source brand book frames the brand around a connected shopping community where buyers and sellers meet through a fun, seamless, and cost-effective experience. That gives the interface a different center of gravity from a severe enterprise system. Shrimp is warmer, rounder, faster, and more human, but it should never become visually noisy. Its best expression is cheerful efficiency.

The visual signature is built around one unmistakable core color: Shrimp Orange (`#FF5722`). Orange is not a decorative wash to flood every surface; the brand book is explicit that it should be used sparingly inside the application so content remains the focus, then used more freely in campaign, print, and external communications. In product UI, this means orange carries action, selection, brand ownership, and moments of confirmation. It sits on a clean white canvas, anchored by deep charcoal (`#212121`) text and softened by pale orange tints (`#FDB098`, `#FFEBE6`) and mint-green support tones (`#00BFA5`, `#D1F4EF`).

Avenir Next is the typographic backbone. Its slightly humanized geometry gives Shrimp a sensible, youthful tone: legible enough for marketplace operations, polished enough for consumer trust, and friendly enough for social shopping. Ultra Light display type can create airy hero moments, while Medium and Demi Bold keep buttons, labels, and product information crisp. The practical brand equation is \( \text{Shrimp} = \text{Seamless} + \text{Social} + \text{Best Value} \), and the UI should make that equation visible through speed, clarity, and warmth.

What defines Shrimp beyond orange is its balance of trust and delight. The design should feel like a safe pair of hands with a smile: clear payment states, transparent logistics, honest copy, and enough visual play to make buying and selling feel low-friction rather than bureaucratic. Use a token system prefixed with `--shrimp-` so the orange, tint, neutral, and status roles stay consistent across mobile, web, print-adjacent assets, and future theme variants.

**Key Characteristics:**
- Avenir Next as the primary family, using Ultra Light for expressive moments and Medium/Demi Bold for interface confidence
- Core accent color: Shrimp Orange (`#FF5722`) for CTAs, brand marks, selected states, and high-value actions
- White and charcoal foundation: `#FFFFFF` for clean product surfaces, `#212121` for body copy and high-trust information
- Pale orange tints (`#FDB098`, `#FFEBE6`) for soft emphasis, campaign blocks, selected backgrounds, and friendly alerts
- Mint-green support color (`#00BFA5`) used subtly to add freshness, success, and secondary visual interest
- Product-first discipline: orange is restrained inside dense application screens and stronger in marketing or empty states
- Rounded, compact components with light borders and soft surface separation, never heavy ornament
- Fixed logo usage: vertical, horizontal, and logomark variants must not be recolored, stretched, skewed, shadowed, or recreated

## 2. Color Palette & Roles

### Primary
- **Shrimp Orange** (`#FF5722`): The core brand color from `PANTONE 172C`. Primary buttons, active navigation, brand marks, important badges, promotional accents, and focused moments of action.
- **White** (`#FFFFFF`): Page background, card surfaces, modal surfaces, white logo variant, and text on orange. Matches `PANTONE 7541C`.
- **Shrimp Charcoal** (`#212121`): Primary copy, headings, product information, legal text, and grounded UI chrome. Sourced from the brand book's secondary black role.

### Neutral Scale (Gray Family)
- **Black** (`#000000`): Greyscale logo variant, monochrome production, and rare high-contrast print use.
- **Charcoal 900** (`#212121`): Primary text, headings, checkout totals, navigation text, and footer background.
- **Charcoal 800** (`#303030`): Dark hover states, dense sidebars, and elevated dark surfaces.
- **Gray 700** (`#4A4A4A`): Strong secondary text, form values, compact metadata.
- **Gray 600** (`#616161`): Body-secondary text, helper copy, timestamps, captions.
- **Gray 500** (`#757575`): Placeholder text, inactive icons, disabled labels.
- **Brand Gray** (`#BDBDBD`): Secondary neutral from `PANTONE Grey C`. Borders, dividers, skeleton loaders, and disabled outlines.
- **Gray 200** (`#E0E0E0`): Subtle lines, table separators, input borders.
- **Gray 100** (`#F5F5F5`): Secondary surface background, page bands, hover fills.
- **Warm Surface** (`#FFF7F4`): Optional warm product surface derived from the orange family for friendly empty states and low-volume highlights.

### Interactive
- **Orange 500** (`#FF5722`): Primary interactive color. `--shrimp-action-primary`, `--shrimp-link-primary`, `--shrimp-focus`.
- **Orange 600** (`#E64A19`): Hover state for primary orange controls, derived for web accessibility and tactile feedback.
- **Orange 700** (`#BF360C`): Active or pressed state for orange controls.
- **Orange Tint 300** (`#FDB098`): Soft promotional blocks, hover tints, accent illustrations, and medium-emphasis callouts.
- **Orange Tint 100** (`#FFEBE6`): Selected rows, light alert backgrounds, badge fills, and focus-adjacent surfaces.
- **Mint 500** (`#00BFA5`): Secondary positive action, success confirmation, safe-progress states, and freshness accents.
- **Mint 100** (`#D1F4EF`): Success surfaces, low-emphasis trust blocks, and supportive status backgrounds.
- **Focus Ring** (`#FF5722`): 2px outline or inset ring with a 2px white offset on colored backgrounds.

### Support & Status
- **Success** (`#00BFA5`): Successful payment, completed logistics step, seller response received, buyer verification passed.
- **Success Surface** (`#D1F4EF`): Background for success banners, inline confirmations, and completed timeline nodes.
- **Warning** (`#FFB020`): Price, stock, delivery, or evidence warnings where orange must remain reserved for brand actions.
- **Warning Surface** (`#FFF3D6`): Light warning background for review-needed states.
- **Error** (`#D93025`): Failed payment, destructive action, missing required evidence, policy violation.
- **Error Surface** (`#FCE8E6`): Light danger background for validation and dispute warnings.
- **Information** (`#00BFA5`): Informational status should lean mint rather than blue to preserve the warm orange/mint brand world.

### Dark Theme (Charcoal Theme)
- **Background**: Charcoal 900 (`#212121`). `--shrimp-background-dark`.
- **Layer 01**: Charcoal 800 (`#303030`). Cards, panels, and sticky bars.
- **Layer 02**: Gray 700 (`#4A4A4A`). Elevated overlays and nested surfaces.
- **Text Primary**: White (`#FFFFFF`). `--shrimp-text-on-dark`.
- **Text Secondary**: Brand Gray (`#BDBDBD`). Descriptions, captions, and lower-emphasis labels.
- **Border Subtle**: Gray 700 (`#4A4A4A`). Dividers and outlines on dark UI.
- **Interactive**: Orange Tint 300 (`#FDB098`) for links and small controls; Orange 500 (`#FF5722`) for primary actions that need full brand force.

## 3. Typography Rules

### Font Family
- **Primary**: `Avenir Next`, with fallbacks: `Avenir, Montserrat, Helvetica Neue, Arial, sans-serif`
- **Display**: `Avenir Next Ultra Light`, with graceful fallback to `Avenir Next` weight 300 or 400
- **Interface Emphasis**: `Avenir Next Medium` and `Avenir Next Demi Bold`
- **Body Fallback**: `Inter, ui-sans-serif, system-ui, sans-serif` when Avenir Next is unavailable
- **Monospace**: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` for order IDs, evidence hashes, logs, and technical metadata

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display 01 | Avenir Next | 56px (3.50rem) | 300 (Ultra Light) | 1.14 (64px) | 0 | Marketplace hero, campaign headline, brand-led moment |
| Display 02 | Avenir Next | 48px (3.00rem) | 300 (Ultra Light) | 1.17 (56px) | 0 | Secondary hero, onboarding, empty-state headline |
| Heading 01 | Avenir Next | 40px (2.50rem) | 400 (Regular) | 1.20 (48px) | 0 | Major page heading, dashboard title |
| Heading 02 | Avenir Next | 32px (2.00rem) | 500 (Medium) | 1.25 (40px) | 0 | Section heading, modal headline |
| Heading 03 | Avenir Next | 24px (1.50rem) | 500 (Medium) | 1.33 (32px) | 0 | Sub-section title, card group heading |
| Heading 04 | Avenir Next | 20px (1.25rem) | 600 (Demi Bold) | 1.40 (28px) | 0 | Product title, card title, panel heading |
| Heading 05 | Avenir Next | 20px (1.25rem) | 400 (Regular) | 1.40 (28px) | 0 | Softer card headings and editorial callouts |
| Body Long 01 | Avenir Next | 16px (1.00rem) | 400 (Regular) | 1.50 (24px) | 0 | Standard reading text, descriptions, policy copy |
| Body Long 02 | Avenir Next | 16px (1.00rem) | 500 (Medium) | 1.50 (24px) | 0 | Emphasized body, product facts, important labels |
| Body Short 01 | Avenir Next | 14px (0.88rem) | 400 (Regular) | 1.43 (20px) | 0 | Compact body, captions, helper copy |
| Body Short 02 | Avenir Next | 14px (0.88rem) | 600 (Demi Bold) | 1.43 (20px) | 0 | Buttons, nav items, compact badges |
| Caption 01 | Avenir Next | 12px (0.75rem) | 500 (Medium) | 1.33 (16px) | 0 | Metadata, timestamps, field hints |
| Code 01 | Monospace | 14px (0.88rem) | 400 (Regular) | 1.43 (20px) | 0 | Inline IDs, technical labels, evidence references |
| Code 02 | Monospace | 16px (1.00rem) | 400 (Regular) | 1.50 (24px) | 0 | Logs, export previews, structured data blocks |
| Mono Display | Monospace | 40px (2.50rem) | 400 (Regular) | 1.20 (48px) | 0 | Rare data-led hero or live counter |

### Principles
- **Friendly precision**: Avenir Next gives Shrimp a clean marketplace voice without becoming cold. Use regular and medium weights for most UI, then reserve Ultra Light for expressive brand moments.
- **Four useful weights**: 300 for display, 400 for reading, 500 for interface clarity, 600 for action and emphasis. Avoid heavy bold unless a legal or operational artifact requires it.
- **Content before color**: Since product listings, dispute evidence, prices, and logistics states carry dense information, type hierarchy should do most of the organizing work before orange is introduced.
- **Short, direct copy**: Shrimp's brand personality is honest and resourceful. UI text should avoid theatrical cleverness in transactional moments and become warmer in onboarding, education, and recovery states.

## 4. Component Stylings

### Buttons

**Primary Button (Orange)**
- Background: `#FF5722` (Shrimp Orange) -> `--shrimp-button-primary`
- Text: `#FFFFFF` (White)
- Padding: 0px 20px
- Border: 1px solid transparent
- Border-radius: 6px
- Height: 48px (default), 40px (compact), 56px (expressive)
- Hover: `#E64A19` (Orange 600) -> `--shrimp-button-primary-hover`
- Active: `#BF360C` (Orange 700) -> `--shrimp-button-primary-active`
- Focus: `2px solid #FF5722` outline + `2px` white offset where needed

**Secondary Button (Charcoal)**
- Background: `#212121` (Shrimp Charcoal)
- Text: `#FFFFFF`
- Hover: `#303030`
- Active: `#000000`
- Same padding/radius as primary

**Tertiary Button (Ghost Orange)**
- Background: transparent
- Text: `#FF5722` (Shrimp Orange)
- Border: 1px solid `#FF5722`
- Hover: `#FFF7F4` background tint + `#E64A19` text
- Border-radius: 6px

**Ghost Button**
- Background: transparent
- Text: `#212121` default, `#FF5722` when brand-led
- Padding: 0px 12px
- Border: none
- Hover: `#FFEBE6` background tint

**Danger Button**
- Background: `#D93025` (Error)
- Text: `#FFFFFF`
- Hover: `#B3261E`
- Active: `#8C1D18`

### Cards & Containers
- Background: `#FFFFFF` for primary cards, `#FFF7F4` or `#F5F5F5` for gentle secondary surfaces
- Border: 1px solid `#E0E0E0` or transparent on very clean marketing sections
- Border-radius: 8px maximum for cards, 6px for compact operational panels
- Hover: border shifts toward `#FDB098` and background may warm to `#FFF7F4`
- Content padding: 16px compact, 24px standard, 32px expressive
- Separation: light border plus soft shadow, not heavy skeuomorphic elevation

### Inputs & Forms
- Background: `#FFFFFF`
- Text: `#212121`
- Padding: 0px 14px
- Height: 44px (default), 48px (large)
- Border: 1px solid `#BDBDBD`
- Border active: `1px solid #212121`
- Focus: `2px solid #FF5722` outline or border
- Error: `1px solid #D93025` border with `#FCE8E6` helper surface when needed
- Label: 12px Avenir Next Medium, Charcoal 900
- Helper text: 12px, Gray 600
- Placeholder: Gray 500 (`#757575`)
- Border-radius: 6px

### Navigation
- Background: `#FFFFFF` for default product navigation, `#FF5722` for brand-led marketing or app-shell moments
- Height: 56px desktop, 52px mobile
- Logo: full-color logo on white when possible; white logo on orange or imagery; black logo only in greyscale contexts
- Links: 14px Avenir Next Medium, `#212121` default
- Link hover: `#FF5722` text or light orange tint background
- Active link: `#FF5722` text with 2px bottom indicator
- Search: prominent rounded input with white surface, charcoal text, and orange focus
- Mobile: hamburger or bottom navigation depending on workflow density

### Links
- Default: `#FF5722` with no underline in navigation and controls
- Hover: `#E64A19` with underline for inline body links
- Visited: remains `#FF5722` unless content policy requires visited differentiation
- Inline links: underlined by default in long-form policy, help, or evidence copy

### Distinctive Components

**Content Block (Hero/Feature)**
- White or warm `#FFF7F4` background with restrained orange emphasis
- Headline left-aligned with 56px or 48px Avenir Next Ultra Light
- CTA as orange primary button, often paired with a softer ghost action
- Product, marketplace, or evidence imagery should be visible and concrete, not purely atmospheric

**Tile (Clickable Card)**
- Background: `#FFFFFF`
- Border: 1px solid `#E0E0E0`
- Border-radius: 8px
- Hover: border `#FDB098`, background `#FFF7F4`, optional small orange chevron or icon
- Avoid filling every tile with orange; let the active or recommended tile carry the accent

**Tag / Label**
- Background: contextual tint such as `#FFEBE6`, `#D1F4EF`, `#F5F5F5`
- Text: corresponding strong color such as `#FF5722`, `#00BFA5`, `#4A4A4A`
- Padding: 4px 8px
- Border-radius: 999px for pill labels
- Font: 12px Avenir Next Medium

**Notification Banner**
- Full-width or contained bar depending on severity
- Informational: Mint 100 background with Charcoal 900 text
- Promotional: Orange 500 background with white text
- Warning: Warning Surface background with Charcoal 900 text
- Dismiss icon right-aligned, 44px touch target

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Component spacing scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px
- Layout spacing scale: 16px, 24px, 32px, 48px, 64px, 80px, 96px, 128px
- Mini unit: 4px for icon/text alignment and dense marketplace metadata
- Padding within components: typically 16px
- Gap between cards/tiles: 12px compact, 16px standard, 24px roomy

### Grid & Container
- 12-column grid for product and marketing pages
- Max content width: 1440px for application shells, 1200px for editorial or brand pages
- Column gutters: 24px desktop, 16px tablet, 12px mobile
- Margin: 16px mobile, 24px tablet, 32px desktop
- Content forms and policy copy should stay within 640px-760px for readable line lengths
- Dense dashboards may use 3-column operational layouts with persistent side panels

### Whitespace Philosophy
- **Product-first breathing room**: Shrimp needs enough density for listings, evidence, logistics, and price comparison, but each cluster should have a clear resting edge.
- **Warm emphasis instead of decoration**: Use orange tints to zone special areas, not decorative gradients or oversized shapes.
- **Fast scanning**: Important values such as price, refund amount, delivery status, and dispute route should align cleanly and repeat predictably across cards.
- **Friendly pauses**: Empty states, onboarding, and success screens can open up to 64px-96px vertical rhythm and use more orange personality.

### Border Radius Scale
- **0px**: Rare print-like dividers, table grid lines, crop-safe brand assets
- **4px**: Small chips, inline controls, compact evidence tags
- **6px**: Buttons, inputs, dropdowns, operational panels
- **8px**: Cards, product tiles, modal containers
- **999px**: Pills, status tags, avatar containers, progress chips

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, `#FFFFFF` background | Default page surface, clean product areas |
| Layer 01 | `1px solid #E0E0E0`, `#FFFFFF` background | Cards, forms, product tiles, evidence panels |
| Layer 02 | `1px solid #FDB098`, `#FFF7F4` background | Selected cards, recommended actions, warm emphasis |
| Raised | `0 8px 24px rgba(33,33,33,0.10)` | Dropdowns, popovers, sticky action bars |
| Overlay | `0 16px 48px rgba(33,33,33,0.18)` + light scrim | Modals, side sheets, high-friction confirmations |
| Brand Moment | `0 12px 32px rgba(255,87,34,0.18)` | Limited use for primary campaign CTA, success reveal, or launch moment |

**Shadow Philosophy**: Shrimp is not shadow-free; it is shadow-careful. Product cards can use light border-and-shadow treatment to feel tappable, but dense marketplace screens should avoid stacked shadows that make the interface look cluttered. Depth should communicate interaction priority: ordinary content sits flat, selected or recommended content warms slightly, and overlays earn the strongest shadow because they interrupt the workflow.

## 7. Do's and Don'ts

### Do
- Use Shrimp Orange (`#FF5722`) as the primary brand and action color
- Use orange sparingly inside application screens so marketplace content, evidence, and prices remain the focus
- Use Avenir Next Regular, Medium, Demi Bold, and Ultra Light according to the hierarchy
- Pair orange with charcoal text and white surfaces for the most recognizable Shrimp expression
- Use mint (`#00BFA5`) subtly for success, freshness, and supportive secondary interest
- Keep logo variants fixed: vertical, horizontal, and logomark should not be rebuilt from parts
- Preserve logo clear space equal to the height of the uppercase `S`
- Use light borders, warm tints, and compact spacing to make dense workflows feel calm and friendly

### Don't
- Don't flood dashboards or product grids with orange backgrounds
- Don't recolor, stretch, skew, shadow, rotate, add transparency to, or recreate the logo
- Don't use the logomark as part of the written brand name
- Don't make the system look luxury, severe, or corporate-heavy; Shrimp should stay youthful and direct
- Don't overuse mint as a competing primary brand color
- Don't rely on vague decorative imagery when product, people, logistics, or evidence imagery would be clearer
- Don't use heavy shadows on every card; elevation should mean something
- Don't use clever copy in critical payment, refund, policy, or dispute states

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Small (sm) | 320px | Single column, bottom-first actions, 16px margins |
| Medium (md) | 640px | 2-column grids begin, larger forms, expanded cards |
| Large (lg) | 1024px | Full navigation visible, dashboard columns appear |
| X-Large (xlg) | 1280px | Dense marketplace layouts, persistent side panels |
| Max | 1440px | Maximum content width, centered application shell |

### Touch Targets
- Button height: 48px default, minimum 40px for compact desktop-only controls
- Navigation links: 44px minimum row height
- Input height: 44px default, 48px for key transactional forms
- Icon buttons: 44px square touch target
- Mobile menu items: full-width 48px rows
- Bottom action bars: 56px minimum height with clear primary/secondary separation

### Collapsing Strategy
- Hero: 56px display -> 40px -> 32px heading as viewport narrows
- Navigation: horizontal nav -> compact top bar -> hamburger or bottom tabs
- Grid: 4-column -> 2-column -> single column
- Product/evidence cards: multi-column comparison -> stacked cards with sticky primary action
- Forms: side-by-side fields -> single-column fields
- Status timelines: horizontal steps -> vertical compact list
- Section padding: 64px -> 40px -> 24px

### Image Behavior
- Responsive images with `max-width: 100%`
- Product photos and evidence images should maintain clear aspect ratios and avoid decorative cropping
- Hero images may shift from side-by-side to stacked below on mobile
- Listing thumbnails should use consistent aspect-ratio containers to prevent layout shift
- Marketplace screenshots should remain readable on desktop and become tappable/fullscreen on mobile

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: Shrimp Orange (`#FF5722`)
- CTA hover: Orange 600 (`#E64A19`)
- Background: White (`#FFFFFF`)
- Warm surface: `#FFF7F4`
- Heading text: Shrimp Charcoal (`#212121`)
- Body text: Shrimp Charcoal (`#212121`)
- Secondary text: Gray 600 (`#616161`)
- Surface/Card: White (`#FFFFFF`)
- Border: Gray 200 (`#E0E0E0`)
- Soft brand tint: Orange Tint 100 (`#FFEBE6`)
- Strong brand tint: Orange Tint 300 (`#FDB098`)
- Success/Mint: `#00BFA5`
- Success surface: `#D1F4EF`
- Error: `#D93025`
- Focus ring: Shrimp Orange (`#FF5722`)

### Example Component Prompts
- "Create a marketplace hero on white background. Headline at 56px Avenir Next Ultra Light, line-height 1.14, color #212121. Subtitle at 16px Regular, line-height 1.50, color #616161, max-width 640px. Orange CTA button (#FF5722 background, #FFFFFF text, 6px border-radius, 48px height, 20px horizontal padding)."
- "Design a product/evidence card: #FFFFFF background, 1px #E0E0E0 border, 8px border-radius, 16px padding. Title at 20px Avenir Next Demi Bold, line-height 1.40, color #212121. Body at 14px Regular, line-height 1.43, color #616161. Hover: border shifts to #FDB098 and background warms to #FFF7F4."
- "Build a form field: #FFFFFF background, 6px border-radius, 44px height, 14px horizontal padding. Label above at 12px Avenir Next Medium, color #212121. Border: 1px solid #BDBDBD default, 2px solid #FF5722 on focus. Placeholder: #757575."
- "Create a brand navigation bar: #FFFFFF background, 56px height. Full-color Shrimp logo left-aligned. Links at 14px Avenir Next Medium, color #212121. Hover: #FF5722 text. Active: #FF5722 with 2px bottom border."
- "Build a status tag component: #FFEBE6 background, #FF5722 text, 4px 8px padding, 999px border-radius, 12px Avenir Next Medium. Use #D1F4EF background and #00BFA5 text for success tags."

### Iteration Guide
1. Orange is the brand and action signal; do not use it as wallpaper in dense product UI
2. The most Shrimp-like screen is white, charcoal, useful, and warmed by controlled orange moments
3. Use Avenir Next with 300, 400, 500, and 600 weights; avoid heavy bold unless absolutely necessary
4. Prefer 6px controls and 8px cards for a friendly but still efficient product surface
5. Mint is supportive, not primary; it should signal success, freshness, and trust
6. Product, logistics, payment, and evidence content should stay visually concrete and easy to scan
7. Use `--shrimp-` token names for semantic implementation, such as `--shrimp-button-primary`, `--shrimp-text-primary`, and `--shrimp-surface-warm`
8. Keep logo usage disciplined: full color whenever possible, white on full-color/imagery, black only for greyscale contexts
