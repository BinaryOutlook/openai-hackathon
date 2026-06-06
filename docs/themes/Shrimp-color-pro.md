# Design System Inspiration of Shrimp

## 1. Visual Theme & Atmosphere

Shrimp's visual world is the digital translation of social commerce made warm, fast, and approachable. The system is built around a bright marketplace orange (`#FF5722`) that behaves less like a decorative accent and more like a storefront light: it signals energy, deal-hunting, movement, and invitation. The surrounding environment stays clean and content-first: white (`#FFFFFF`) surfaces, black body copy (`#212121`), pale peach tints (`#FFEBE6`) for warmth, and teal-green (`#00BFA5`) used sparingly to add freshness, trust, and social liveliness.

The atmosphere should feel like a marketplace where everything is easy to enter, easy to understand, and easy to act on. Shrimp is not austere or corporate. It is friendly, resourceful, lightly playful, and practical. The visual identity should carry the same personality described in the brand book: approachable, honest, fun, youthfully well-dressed, stylish without being flashy, and always a safe pair of hands. The design should smile without becoming childish; it should sell without becoming noisy.

Avenir Next is the typographic backbone. Its clean geometric construction gives the interface a modern app-like clarity, while its softened details keep the brand from feeling mechanical. Ultra Light works well for campaign-scale statements, Regular carries the reading experience, and Medium gives just enough emphasis to buttons, labels, and navigation without the heaviness of bold UI. The overall effect is friendly precision: crisp enough for ecommerce, warm enough for community.

What defines Shrimp beyond orange is the balance between excitement and reassurance. Orange pulls people toward action. Black keeps copy readable and grounded. Green brings moments of delight or confirmation. Peach and aqua tints prevent the primary colour from overwhelming the page. The design language should feel mobile-first, social, seamless, cost-effective, and fast - a visual system made for buyers and sellers moving through a lively end-to-end shopping experience.

**Key Characteristics:**
- Avenir Next Ultra Light for large campaign headlines - youthful, open, and stylish without shouting
- Avenir Next Regular for body copy, product descriptions, and readable marketplace content
- Avenir Next Medium for UI labels, buttons, nav items, prices, and compact emphasis
- Single core brand colour: Shrimp Orange (`#FF5722`) - primary logo colour, CTA colour, campaign colour, and strongest brand cue
- Supporting green (`#00BFA5`) used subtly for social energy, reassurance, and visual interest
- Warm tints (`#FDB098`, `#FFEBE6`) used when full orange would overpower content
- Clean white surfaces with black body copy (`#212121`) - commerce clarity before decoration
- Rounded, friendly components - buttons, cards, tags, and input fields should feel touchable rather than rigid
- Flat illustration language with simple shapes, circular backdrops, and cheerful iconography
- Logo discipline: fixed vertical, horizontal, and logomark versions; no recolouring, stretching, skewing, shadows, or transparency on full-colour marks

## 2. Color Palette & Roles

### Primary
- **Shrimp Orange / PANTONE 172C** (`#FF5722`): The core brand colour. Used for primary CTAs, logo, campaign moments, active navigation, price emphasis, promotional badges, and high-priority interactive states. Orange should be used sparingly inside product interfaces so content remains the focus, and more freely in marketing, launch, and campaign communications.
- **White / PANTONE 7541C** (`#FFFFFF`): Default page background, card surface, app shell surface, and logo colour on orange, dark, or full-colour imagery.
- **Shrimp Black / PANTONE Black C** (`#212121`): Primary body copy, headings, product names, navigation text, and grounded UI elements. This is the text anchor that keeps the orange system from becoming too loud.

### Neutral Scale (Gray Family)
- **Pure Black / Logo Black** (`#000000`): Greyscale logo use, legal marks, monochrome print, and rare maximum-contrast applications.
- **Shrimp Black** (`#212121`): Primary text, headings, footer background, dark UI chrome, price text, and high-emphasis icons.
- **Gray 80** (`#424242`): Secondary dark text, dark card surfaces, pressed states on dark backgrounds.
- **Gray 70** (`#616161`): Secondary text, product metadata, helper copy, subdued navigation.
- **Gray 60** (`#757575`): Placeholder text, disabled labels, muted icons.
- **Shrimp Grey / PANTONE Grey C** (`#BDBDBD`): Borders, dividers, disabled surfaces, secondary UI outlines.
- **Gray 30** (`#E0E0E0`): Hairline dividers, product-card borders, input borders.
- **Gray 20** (`#EEEEEE`): Subtle page zoning, skeleton states, inactive tab backgrounds.
- **Gray 10** (`#F7F7F7`): Soft app background, product grid background, light container fills.
- **White** (`#FFFFFF`): Primary commerce surface and highest-readability content layer.

### Interactive
- **Orange 60 / Shrimp Orange** (`#FF5722`): Primary action, active tab, primary icon highlight, CTA background, campaign emphasis. Token: `--shrimp-interactive-primary`.
- **Orange 70 / Hover Orange** (`#E64A19`): Hover state for primary orange buttons, links, and active controls. Token: `--shrimp-interactive-hover`.
- **Orange 80 / Pressed Orange** (`#BF360C`): Active/pressed state for orange components. Token: `--shrimp-interactive-active`.
- **Orange 30 / PANTONE 487C** (`#FDB098`): Soft orange highlight, secondary campaign background, hover tint, illustration fill.
- **Orange 10 / PANTONE 705C** (`#FFEBE6`): Pale peach page bands, selected lightweight backgrounds, empty states, and brand warmth behind content.
- **Green 60 / PANTONE 7465C** (`#00BFA5`): Secondary interaction, success-adjacent confirmation, social emphasis, positive tags, and subtle visual interest. Token: `--shrimp-interactive-secondary`.
- **Green 30 / PANTONE 3245C** (`#79D9CC`): Green tint for illustrations, secondary cards, progress moments, and friendly supporting graphics.
- **Green 10 / PANTONE 317C** (`#D1F4EF`): Soft success or social-community background where full green would distract.
- **Focus Orange** (`#FF5722`): Keyboard focus, focused inputs, active controls, and accessible outline states. Token: `--shrimp-focus`.

### Support & Status
- **Orange 60** (`#FF5722`): Attention, promotional urgency, informational brand notices, limited-time offers.
- **Green 60** (`#00BFA5`): Success, completed checkout, verified seller, payment protected, positive confirmation.
- **Amber 50** (`#FFB300`): Warning, low stock, delivery delay, time-sensitive caution. Derived for UI status; keep secondary to brand orange.
- **Red 60** (`#D32F2F`): Error, destructive action, failed payment, validation error. Derived for accessibility and conventional status recognition.
- **Gray 60** (`#757575`): Disabled, unavailable, out-of-stock secondary information.

### Dark Theme (Shrimp Black Theme)
- **Background**: Shrimp Black (`#212121`). Token: `--shrimp-background-dark`.
- **Layer 01**: Dark Gray (`#2C2C2C`). Card and container surfaces.
- **Layer 02**: Gray 80 (`#424242`). Elevated surfaces, nav panels, drawers.
- **Text Primary**: White (`#FFFFFF`). Token: `--shrimp-text-on-dark`.
- **Text Secondary**: Shrimp Grey (`#BDBDBD`). Token: `--shrimp-text-secondary-dark`.
- **Border Subtle**: Gray 80 (`#424242`). Token: `--shrimp-border-dark`.
- **Interactive**: Orange 30 (`#FDB098`) for links and highlights on dark surfaces; use full Orange 60 only for major CTAs.
- **Success/Trust**: Green 30 (`#79D9CC`) on dark backgrounds for confirmation and seller-trust cues.

## 3. Typography Rules

### Font Family
- **Primary**: `Avenir Next`, with fallbacks: `Avenir, Helvetica Neue, Arial, sans-serif`
- **Display**: `Avenir Next Ultra Light`, with fallbacks: `Avenir Next, Helvetica Neue, Arial, sans-serif`
- **UI Emphasis**: `Avenir Next Medium`, with fallbacks: `Avenir Next, Helvetica Neue, Arial, sans-serif`
- **Monospace** (limited use): `Menlo, Consolas, Monaco, monospace` for order IDs, coupon codes, tracking numbers, and developer-facing snippets
- **Icon Style**: Rounded line icons and flat filled marketplace icons; strokes should feel friendly, simple, and app-native

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display 01 | Avenir Next | 60px (3.75rem) | Ultra Light | 1.13 (68px) | -0.2px | Campaign hero, launch pages, brand moments |
| Display 02 | Avenir Next | 48px (3.00rem) | Ultra Light | 1.17 (56px) | -0.1px | Secondary hero, large promo banners |
| Heading 01 | Avenir Next | 42px (2.63rem) | Ultra Light | 1.19 (50px) | 0 | Expressive page headline |
| Heading 02 | Avenir Next | 32px (2.00rem) | Regular | 1.25 (40px) | 0 | Section headings, landing pages |
| Heading 03 | Avenir Next | 24px (1.50rem) | Medium | 1.33 (32px) | 0 | Module titles, checkout step titles |
| Heading 04 | Avenir Next | 20px (1.25rem) | Medium | 1.40 (28px) | 0 | Card titles, product modules, seller blocks |
| Heading 05 | Avenir Next | 20px (1.25rem) | Regular | 1.40 (28px) | 0 | Softer editorial headings |
| Body Long 01 | Avenir Next | 16px (1.00rem) | Regular | 1.50 (24px) | 0 | Standard reading text, descriptions |
| Body Long 02 | Avenir Next | 16px (1.00rem) | Medium | 1.50 (24px) | 0 | Emphasized body, seller names, labels |
| Body Short 01 | Avenir Next | 14px (0.88rem) | Regular | 1.43 (20px) | 0 | Product metadata, compact UI, list rows |
| Body Short 02 | Avenir Next | 14px (0.88rem) | Medium | 1.43 (20px) | 0 | Nav items, buttons, active filters |
| Caption 01 | Avenir Next | 12px (0.75rem) | Regular | 1.33 (16px) | 0.12px | Tags, timestamps, delivery notes |
| Caption 02 | Avenir Next | 12px (0.75rem) | Medium | 1.33 (16px) | 0.12px | Voucher labels, small badges, status chips |
| Price Display | Avenir Next | 28px (1.75rem) | Medium | 1.14 (32px) | 0 | Product price, cart total, campaign price |
| Code / Data 01 | Menlo | 14px (0.88rem) | Regular | 1.43 (20px) | 0 | Order IDs, coupon codes, tracking numbers |

### Principles
- **Lightness for campaigns, not weakness**: Avenir Next Ultra Light gives Shrimp campaign headlines a youthful, airy quality. It should be used at large sizes where the letterforms have room to breathe; below 32px, move to Regular or Medium for legibility.
- **Medium is the strongest everyday weight**: Buttons, labels, product prices, and navigation should use Medium rather than heavy bold. The brand feels energetic through colour and composition, not typographic shouting.
- **Readable commerce first**: Product titles, descriptions, policies, checkout copy, and seller information should prioritise clear line-height and predictable spacing. The customer should never fight the typography to understand price, delivery, or payment.
- **Small type stays calm**: Use minimal tracking only on 12px captions and labels. Avoid aggressive letter-spacing; Shrimp's friendliness comes from clarity, not from luxury-brand spacing.
- **Price has its own rhythm**: Prices should be visually strong, usually Shrimp Orange or Shrimp Black, but they should not distort the product grid. Use consistent price sizing across cards to prevent visual noise.

## 4. Component Stylings

### Buttons

**Primary Button (Orange)**
- Background: `#FF5722` (Shrimp Orange) -> `--shrimp-button-primary`
- Text: `#FFFFFF` (White)
- Padding: 14px 24px
- Border: 1px solid transparent
- Border-radius: 4px default, 24px for pill CTAs and campaign actions
- Height: 48px default, 40px compact, 56px expressive
- Hover: `#E64A19` (Hover Orange) -> `--shrimp-button-primary-hover`
- Active: `#BF360C` (Pressed Orange) -> `--shrimp-button-primary-active`
- Focus: `2px solid #FF5722` outline + `2px solid #FFFFFF` offset where needed
- Icon placement: trailing arrow or cart icon at 16px, with 8px gap

**Secondary Button (Black / Trust)**
- Background: `#212121` (Shrimp Black)
- Text: `#FFFFFF`
- Hover: `#424242` (Gray 80)
- Active: `#000000` (Pure Black)
- Border-radius: 4px default
- Use for high-contrast account actions, checkout continuation on pale backgrounds, or dark campaign layouts

**Tertiary Button (Ghost Orange)**
- Background: transparent
- Text: `#FF5722` (Shrimp Orange)
- Border: 1px solid `#FF5722`
- Hover: `#FFEBE6` background tint + `#E64A19` text
- Active: `#FDB098` tint background
- Border-radius: 4px default, 24px for promotional pills

**Ghost Button**
- Background: transparent
- Text: `#FF5722` (Shrimp Orange) or `#212121` for low-emphasis utility actions
- Padding: 12px 16px
- Border: none
- Hover: `#FFEBE6` background tint
- Active: `#FDB098` background tint
- Use for filters, inline actions, carousel arrows, and low-risk text CTAs

**Danger Button**
- Background: `#D32F2F` (Error Red)
- Text: `#FFFFFF`
- Hover: `#B71C1C`
- Active: `#8E0000`
- Border-radius: 4px
- Use only for destructive actions such as removing payment methods, deleting listings, or cancelling irreversible operations

### Cards & Containers
- Background: `#FFFFFF` for product cards and core commerce content
- Secondary surface: `#F7F7F7` for page background and product-grid zones
- Brand-tint surface: `#FFEBE6` for campaign bands, onboarding, empty states, and friendly education moments
- Border: 1px solid `#EEEEEE` or `#E0E0E0` for product-card separation
- Border-radius: 8px default; 12px for campaign cards and illustrations; 4px for dense product cards
- Hover: border shifts to `#FDB098` or background warms to `#FFF5F2`
- Shadow: subtle only, e.g. `0 2px 8px rgba(33,33,33,0.08)` for floating cards and dropdowns
- Content padding: 16px default, 12px compact, 24px expressive
- Product image area: white or very light gray, object-fit cover, rounded top corners when the card is rounded
- Price area: Orange 60 or Black 100, visually consistent across a grid

### Inputs & Forms
- Background: `#FFFFFF` default, `#F7F7F7` for search fields and app chrome
- Text: `#212121` (Shrimp Black)
- Padding: 0px 14px or 0px 16px
- Height: 40px compact, 48px default, 56px expressive/search
- Border: 1px solid `#E0E0E0`
- Border-radius: 4px default, 24px for search bars
- Focus: 1px border `#FF5722` + soft `0 0 0 2px #FFEBE6` halo
- Error: 1px border `#D32F2F` + helper text in `#D32F2F`
- Label: 12px Avenir Next Medium, `#616161`
- Helper text: 12px Avenir Next Regular, `#757575`
- Placeholder: Gray 60 (`#757575`)
- Prefix/suffix icons: 20px rounded line icons, `#757575` default, `#FF5722` active
- Search fields: pill shape, left search icon, optional orange submit button or icon button

### Navigation
- Primary web background: `#FFFFFF` with orange logo and black text
- Campaign/mobile masthead: `#FF5722` with white logo and white utility icons
- Height: 56px mobile/app, 64px desktop, 48px compact sticky bar
- Logo: S-bag logomark or horizontal wordmark; never recoloured outside approved orange, white, or black options
- Links: 14px Avenir Next Medium, `#212121` default
- Link hover: `#FF5722` text or peach underline
- Active link: `#FF5722` with 2px bottom-border indicator or filled orange pill for mobile tabs
- Search: prominent pill-shaped search field, usually central on marketplace pages
- Utility icons: cart, notifications, messages, profile; 24px icons with 44px-48px touch targets
- Mobile: orange top app bar + bottom navigation for core marketplace actions

### Links
- Default: `#FF5722` (Shrimp Orange) with no underline in navigation/UI
- Hover: `#E64A19` with underline for text links
- Active: `#BF360C`
- Visited: remains Orange 60 for brand consistency unless content-heavy documentation requires visited-state differentiation
- Inline links: underlined by default in long body copy
- Secondary link: `#00BFA5` only when the link supports social, help, confirmation, or trust-oriented content

### Distinctive Components

**Content Block (Hero/Feature)**
- Full-width white or Orange 10 (`#FFEBE6`) background bands
- Headline at 60px or 48px Avenir Next Ultra Light
- Supporting line at 16px Regular, max-width 640px, Shrimp Black or Gray 70
- CTA as orange primary button, often with cart, arrow, or shopping-bag icon
- Illustration or product collage uses orange, green, peach, and aqua circles; keep flat, friendly, and uncluttered
- Campaign hero may use full orange background with white logo/text and black or white supporting typography

**Tile (Clickable Card)**
- Background: `#FFFFFF` on neutral pages, `#FFEBE6` for brand-highlight tiles
- Border: 1px solid `#EEEEEE`
- Border-radius: 8px
- Padding: 16px
- Hover: border `#FDB098`, subtle shadow, or peach-tint lift
- Product tiles should reserve visual hierarchy for image, title, price, rating, and delivery/trust information
- Social/community tiles can use green accents and rounded avatar clusters

**Tag / Label**
- Orange tag: `#FFEBE6` background, `#FF5722` text
- Green tag: `#D1F4EF` background, `#00BFA5` text
- Neutral tag: `#EEEEEE` background, `#424242` text
- Padding: 4px 8px compact, 6px 10px default
- Border-radius: 24px pill
- Font: 12px Avenir Next Medium
- Use for free shipping, verified seller, voucher, hot deal, social recommendation, and order status

**Notification Banner**
- Promo banner: Orange 60 (`#FF5722`) background, white text, optional white icon
- Trust banner: Green 60 (`#00BFA5`) background, white text
- Subtle system banner: Orange 10 (`#FFEBE6`) background, Shrimp Black text, orange icon
- Height: 40px compact, 48px default
- Close/dismiss icon right-aligned with 40px touch target
- Keep message concise; Shrimp banners should feel helpful, not interruptive

## 5. Layout Principles

### Spacing System
- Base unit: 8px for layout and component rhythm
- Micro unit: 4px for icon/text gaps, badge padding, and tight product-card adjustments
- Component spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px
- Layout spacing scale: 16px, 24px, 32px, 48px, 64px, 80px, 96px, 128px
- Padding within cards: 16px default, 12px dense, 24px expressive
- Gap between product cards: 8px mobile, 16px desktop, 24px editorial/marketing
- Minimum touch spacing: 8px between adjacent interactive controls

### Grid & Container
- Mobile-first grid: 4 columns on small screens, 8 columns on tablet, 12 columns on desktop
- Max content width: 1200px for commerce pages, 1440px for campaign landing pages
- Column gutters: 16px mobile, 24px tablet, 32px desktop
- Margin: 16px mobile, 24px tablet, 32px desktop+
- Product grid: 2 columns mobile, 3 columns tablet, 4-6 columns desktop depending on product density
- Content reading width: 640px-760px for policy, help, and editorial text
- Full-bleed campaign sections may use orange or peach backgrounds with contained content inside

### Whitespace Philosophy
- **Marketplace clarity**: Shrimp should feel full of opportunity, but not chaotic. Dense product grids are acceptable when hierarchy is disciplined: image, title, price, rating, delivery, action.
- **Warm zoning**: Use pale peach (`#FFEBE6`) and light gray (`#F7F7F7`) to separate content areas instead of heavy borders. This keeps the experience soft and friendly.
- **Actionable breathing room**: CTAs need room to be confidently tapped. Cards can be dense, but checkout, payment, and account flows should use more whitespace to build trust.
- **Campaign rhythm**: Marketing pages can breathe more than app screens. Use 64px-96px vertical spacing for heroes and 48px for major section transitions.

### Border Radius Scale
- **0px**: Rare; only for full-bleed image crops, table dividers, and print-like rules
- **4px**: Default buttons, inputs, compact controls, dense commerce UI
- **8px**: Product cards, dropdowns, panels, app containers
- **12px**: Campaign cards, onboarding blocks, illustration containers
- **24px**: Search bars, tags, pills, voucher labels, rounded CTAs
- **50%**: Avatars, circular icon buttons, illustration backdrops, profile indicators

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, `#FFFFFF` background | Default app/page surface |
| Layer 01 | No shadow, `#F7F7F7` background | Product grid zones, page bands |
| Layer 02 | No shadow or border only, `#FFEBE6` background | Brand highlight blocks, onboarding, empty states |
| Card | `1px solid #EEEEEE` + optional `0 1px 3px rgba(33,33,33,0.06)` | Product cards, seller modules, content tiles |
| Raised | `0 2px 8px rgba(33,33,33,0.12)` | Dropdowns, popovers, sticky checkout summaries |
| Overlay | `0 8px 24px rgba(33,33,33,0.18)` + light/dark scrim | Modals, side drawers, cart panels |
| Focus | `2px solid #FF5722` or `0 0 0 2px #FFEBE6` | Keyboard focus, active inputs, selected controls |
| Status Glow | Soft tint background (`#FFEBE6` or `#D1F4EF`) | Positive confirmation, promo emphasis, trust callouts |

**Shadow Philosophy**: Shrimp should be mostly flat, bright, and direct, but ecommerce needs enough lift to separate clickable objects from dense content. Use borders and colour zoning first. Use shadows when an element genuinely floats, overlaps, or demands immediate action: dropdowns, modals, sticky cart summaries, vouchers, and product-card hover states. Shadows should stay soft and short; the brand's energy should come from orange, motion, illustration, and product content, not from heavy simulated depth.

## 7. Do's and Don'ts

### Do
- Use Shrimp Orange (`#FF5722`) as the core brand and CTA colour
- Use orange sparingly inside product/application UI so listings, prices, and content remain easy to scan
- Use orange more freely in marketing, launch, event, and campaign communications
- Use Avenir Next Ultra Light for large display headlines and Avenir Next Regular for readable body copy
- Use Avenir Next Medium for buttons, navigation, prices, labels, and compact emphasis
- Use black (`#212121`) primarily for body copy and key commerce information
- Use green (`#00BFA5`) subtly to add freshness, trust, success, or social visual interest
- Use tints (`#FDB098`, `#FFEBE6`, `#79D9CC`, `#D1F4EF`) when full-strength brand colours would overwhelm the communication
- Keep the logo versions fixed: vertical, horizontal, and logomark should not be rebuilt from parts
- Maintain clear space around the logo equal to the height of the uppercase S
- Use rounded, friendly shapes that feel touchable and app-native
- Build mobile-first layouts with large tap targets and clear hierarchy

### Don't
- Don't recolour the full-colour logo outside approved orange, white, or black versions
- Don't add shadows to the logo
- Don't stretch, skew, rotate, or distort the logo
- Don't use the logomark as part of the written brand name
- Don't apply transparency to the full-colour logo
- Don't flood product interfaces with orange; the brand book specifically frames orange as powerful enough to require restraint in-app
- Don't use green as a competing primary colour; it is a supporting accent
- Don't use heavy bold typography as the default emphasis style; use Medium and colour hierarchy first
- Don't make cards overly skeuomorphic or heavy; the system should remain flat, bright, and modern
- Don't hide critical commerce information behind decorative illustration
- Don't use gradients as a default brand treatment; keep colour surfaces clean and direct
- Don't make desktop-first layouts that collapse awkwardly on mobile

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Small (sm) | 320px | Single-column content, 2-column product grid, orange app bar, 16px margins |
| Medium (md) | 600px | 2-column editorial layouts, 3-column product grid, larger search field |
| Large (lg) | 960px | Full desktop navigation, 4-column product grid, side filters visible |
| X-Large (xlg) | 1280px | 5-6 column product grid, expanded campaign layouts, wider hero compositions |
| Max | 1440px | Maximum campaign canvas, centered content with generous margins |

### Touch Targets
- Button height: 48px default, minimum 40px compact
- Primary mobile CTA: 48px-56px high and full-width when action is critical
- Navigation links: 44px-48px row height for touch
- Input height: 48px default, 56px for search
- Icon buttons: 44px minimum, 48px preferred
- Bottom navigation items: 56px-64px high with icon + label
- Tags/chips: 32px default interactive height

### Collapsing Strategy
- Hero: 60px display -> 42px -> 32px heading as viewport narrows
- Navigation: full horizontal masthead -> compact top bar + bottom navigation
- Search: desktop central search -> mobile full-width search under app bar or inside sticky header
- Product grid: 6-column -> 4-column -> 3-column -> 2-column
- Filters: left sidebar -> top filter row -> bottom sheet drawer on mobile
- Cards: horizontal media/text card -> vertical stacked card
- Checkout: multi-column order summary -> sticky bottom summary + single-column form
- Footer: multi-column link groups -> accordion or stacked sections
- Section padding: 64px -> 48px -> 32px -> 16px

### Image Behavior
- Product images use `object-fit: cover` inside consistent aspect-ratio containers
- Product-grid thumbnails should maintain consistent crop ratios to preserve scanability
- Hero illustrations scale proportionally and may move below text on mobile
- Campaign art should use simplified shapes at small sizes; avoid tiny decorative details that disappear
- Seller avatars remain circular and should not fall below 32px except in dense metadata rows
- Data visualizations, checkout tables, and order histories should horizontally scroll rather than compress beyond legibility

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: Shrimp Orange (`#FF5722`)
- Primary CTA hover: Hover Orange (`#E64A19`)
- Primary CTA active: Pressed Orange (`#BF360C`)
- Background: White (`#FFFFFF`)
- App background: Light Gray (`#F7F7F7`)
- Heading text: Shrimp Black (`#212121`)
- Body text: Shrimp Black (`#212121`)
- Secondary text: Gray 70 (`#616161`)
- Muted text: Gray 60 (`#757575`)
- Surface/Card: White (`#FFFFFF`)
- Border: Gray 30 (`#E0E0E0`)
- Brand tint: Orange 10 (`#FFEBE6`)
- Brand soft accent: Orange 30 (`#FDB098`)
- Secondary accent: Green 60 (`#00BFA5`)
- Secondary tint: Green 10 (`#D1F4EF`)
- Link: Shrimp Orange (`#FF5722`)
- Link hover: Hover Orange (`#E64A19`)
- Focus ring: Shrimp Orange (`#FF5722`)
- Error: Red 60 (`#D32F2F`)
- Success: Green 60 (`#00BFA5`)

### Example Component Prompts
- "Create a hero section on a pale peach background (#FFEBE6). Headline at 60px Avenir Next Ultra Light, line-height 1.13, color #212121. Subtitle at 16px Avenir Next Regular, line-height 1.50, color #616161, max-width 640px. Orange CTA button (#FF5722 background, #FFFFFF text, 4px border-radius, 48px height, 14px 24px padding). Use a flat marketplace illustration with orange, peach, teal, and aqua circular shapes."
- "Design a product card: #FFFFFF background, 1px solid #EEEEEE border, 8px border-radius, 16px padding, optional subtle hover shadow. Product title at 14px Avenir Next Regular, line-height 1.43, color #212121. Price at 20px Avenir Next Medium, color #FF5722. Metadata at 12px, color #757575. Add a pill tag with #FFEBE6 background and #FF5722 text."
- "Build a search field: #F7F7F7 background, 24px border-radius, 48px height, 16px horizontal padding. Placeholder at 14px Avenir Next Regular, color #757575. Search icon at 20px, color #757575. Focus state uses #FF5722 border and #FFEBE6 outer halo."
- "Create a desktop navigation bar: #FFFFFF background, 64px height. Orange S-bag horizontal logo left-aligned. Links at 14px Avenir Next Medium, color #212121. Hover state changes text to #FF5722. Active state has a 2px #FF5722 bottom border. Search field is centered and pill-shaped. Cart/profile icons use 48px touch targets."
- "Build a voucher tag component: #FFEBE6 background, #FF5722 text, 6px 10px padding, 24px border-radius, 12px Avenir Next Medium. For trust or verified status, use #D1F4EF background with #00BFA5 text."

### Iteration Guide
1. Always start with Shrimp Orange (`#FF5722`) as the primary brand cue, then reduce it if the interface becomes too loud
2. Use white and black for clarity; ecommerce content must stay readable before it becomes decorative
3. Use green (`#00BFA5`) as a supporting accent only - trust, success, social energy, or subtle visual interest
4. Use tints when full orange overwhelms the page: `#FDB098` for soft orange, `#FFEBE6` for pale peach background
5. Use Avenir Next Ultra Light only at large sizes; switch to Regular or Medium for UI and small text
6. Keep button, card, input, and tag corners rounded; Shrimp should feel friendly and touchable
7. Keep logo usage strict: no recolour, no skew, no rotation, no shadow, no transparency on the full-colour mark
8. Preserve logo clear space equal to the uppercase S height
9. Build mobile-first: big search, clear product grids, obvious CTAs, and 44px-48px touch targets
10. Let product content and user actions lead; brand colour supports the experience rather than competing with it
