---
name: shadcn-ui
description: >-
  Strict UI/UX component design and implementation standards for Yanhee Hospital DMS.
  Mandates using pre-installed shadcn/ui components located at frontend/components/ui/ (@/components/ui/*).
  Requires invoking 'bunx --bun skills add shadcn/ui' during UI/UX design workflows.
  Enforces zero-raw-HTML controls, Radix ScrollArea table-expansion containment ([&>div]:!block),
  mandatory scrollbar visibility (type="always"), zero-native-tooltip anti-stacking, single-row truncation (...),
  comprehensive mobile and tablet responsiveness (Sheet side="left" / side="right", touch targets, no-scrollbar overflow),
  asks or installs missing components via ui.shadcn, and guarantees high-density hospital-grade aesthetics.
---

# shadcn/ui Design & Implementation Guidelines for Yanhee Hospital DMS

## 1. Mandatory UI/UX Workflow & Tooling Standard

Whenever designing, refactoring, or building UI/UX components in this project:
1. **Mandatory CLI Workflow**:
   ```bash
   bunx --bun skills add shadcn/ui
   ```
2. **Strict Component Source**:
   - **ALL** user interface controls, inputs, surfaces, overlays, and feedback elements across the entire project **MUST** use the official shadcn components in:
     `frontend/components/ui/` (imported via `@/components/ui/<component>`).
3. **Missing Components Protocol**:
   - If a specific UI component is needed and not found in `frontend/components/ui/`:
     - **Option A**: Ask the user before adding or replacing.
     - **Option B**: If appropriate and needed, install it via the official shadcn CLI from inside `frontend/`:
       ```bash
       bunx --bun shadcn@latest add <component_name>
       ```

---

## 2. Pre-Installed shadcn/ui Components Catalog

The following components are pre-installed and available in `frontend/components/ui/`:

| Component Category | Available Files in `frontend/components/ui/` | Primary Import Path |
| :--- | :--- | :--- |
| **Buttons & Triggers** | `button.tsx`, `button-group.tsx`, `toggle.tsx`, `kbd.tsx` | `@/components/ui/button`, `@/components/ui/button-group`, `@/components/ui/toggle`, `@/components/ui/kbd` |
| **Inputs & Forms** | `input.tsx`, `input-group.tsx`, `textarea.tsx`, `checkbox.tsx`, `select.tsx`, `native-select.tsx`, `label.tsx`, `field.tsx` | `@/components/ui/input`, `@/components/ui/select`, `@/components/ui/native-select`, `@/components/ui/checkbox`, `@/components/ui/label`, `@/components/ui/field` |
| **Containers & Surfaces** | `card.tsx`, `item.tsx`, `separator.tsx`, `scroll-area.tsx`, `resizable.tsx` | `@/components/ui/card`, `@/components/ui/separator`, `@/components/ui/scroll-area`, `@/components/ui/resizable` |
| **Navigation & Tabs** | `tabs.tsx`, `breadcrumb.tsx`, `pagination.tsx`, `sidebar.tsx` | `@/components/ui/tabs`, `@/components/ui/breadcrumb`, `@/components/ui/pagination`, `@/components/ui/sidebar` |
| **Overlays & Modals** | `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `context-menu.tsx`, `tooltip.tsx`, `command.tsx`, `combobox.tsx` | `@/components/ui/dialog`, `@/components/ui/sheet`, `@/components/ui/tooltip`, `@/components/ui/dropdown-menu`, `@/components/ui/alert-dialog` |
| **Feedback & Badges** | `badge.tsx`, `alert.tsx`, `skeleton.tsx`, `empty.tsx`, `bubble.tsx`, `marker.tsx`, `message.tsx`, `message-scroller.tsx` | `@/components/ui/badge`, `@/components/ui/alert`, `@/components/ui/skeleton`, `@/components/ui/empty` |
| **Data & Media** | `table.tsx`, `calendar.tsx`, `avatar.tsx`, `accordion.tsx`, `collapsible.tsx`, `attachment.tsx` | `@/components/ui/table`, `@/components/ui/avatar`, `@/components/ui/accordion`, `@/components/ui/collapsible` |

---

## 3. Strict Prohibitions & Mapping Rules

### ❌ Never Use Raw HTML Where shadcn Exists
| Instead of Raw HTML | Use shadcn Component from `@/components/ui/` |
| :--- | :--- |
| `<button className="...">` | `<Button variant="..." size="...">` or `<Toggle>` |
| `<input type="text">` | `<Input ... />` or `<InputGroup>` |
| `<select className="...">` | `<Combobox>` (Preferred for searchable & dynamic selection) or `<Select>` / `<NativeSelect>` |
| `<input type="checkbox">` | `<Checkbox checked={...} onCheckedChange={...} />` |
| `<label className="...">` | `<Label>` from `@/components/ui/label` |
| `<div className="border rounded p-4 bg-white">` | `<Card>`, `<CardContent>`, `<CardHeader>`, `<CardTitle>` |
| `<span className="px-2 py-0.5 rounded-full ...">` | `<Badge variant="...">` |
| `<div className="h-px bg-slate-200" />` | `<Separator />` or `<Separator orientation="vertical" />` |
| `<div className="overflow-y-auto">` | `<ScrollArea className="...">` |
| Raw custom empty state `div` | `<Empty>`, `<EmptyHeader>`, `<EmptyMedia>`, `<EmptyTitle>`, `<EmptyDescription>` |
| Basic `title="..."` tooltips | `<TooltipProvider><Tooltip><TooltipTrigger>...<TooltipContent>...</TooltipContent></Tooltip></TooltipProvider>` |

### 3.1 Combobox Standards & Implementation Pattern (`@/components/ui/combobox`)
For dropdowns, lists of choices, categories, devices, and options, **always prefer `<Combobox>`** over static `<select>` or `<NativeSelect>`. Combobox provides real-time search filtering, accessibility, and high-density hospital-grade ergonomics.

**Standard Combobox Implementation Pattern**:
```tsx
"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const frameworks = [
  "Next.js",
  "SvelteKit",
  "Nuxt.js",
  "Remix",
  "Astro",
] as const

export function ComboboxBasic() {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput placeholder="Select a framework" />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
```

**Key Combobox Guidelines**:
1. **Always wrap list in `<ComboboxList>`** using a function `(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>`.
2. **Always include `<ComboboxEmpty>`** for zero-search-results feedback (e.g. `ไม่พบข้อมูลที่ค้นหา`).
3. **Controlled Usage**: Pass `value={selectedValue}` and `onValueChange={(val: string | null) => ...}`.
4. **Popup Layering**: Set `className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md"` on `<ComboboxContent>` to prevent backdrop clipping.

---

## 4. Critical Architectural Fix: Radix ScrollArea Viewport Table-Expansion Rule

### The Technical Issue
Radix UI's `ScrollAreaPrimitive.Viewport` component automatically renders an internal child `<div>` with hardcoded inline styling:
```html
<div style="min-width: 100%; display: table;">
```
In any CSS Flexbox or Grid layout (such as sidebars, trees, lists, and drawers), elements with `display: table` do **NOT** observe `overflow: hidden` on their flex parent. Instead, they calculate their size based on `max-content`.

If any child text is long (e.g. an 80-character medical document name), this internal `div` expands outward horizontally (e.g. to 550px+), producing 3 critical defects:
1. **Container Overflow**: Buttons and rows balloon far past the sidebar boundary.
2. **Badge Displacement**: Trailing metadata badges (`[แพทย์]`, `[Xน.]`) get pushed completely off-screen.
3. **Floating Tooltip Detachment**: Radix `<Tooltip>` positions itself relative to the 550px wide button boundary, causing the tooltip to float 200px+ into empty canvas space.

### Mandatory Architecture Solution
In `frontend/components/ui/scroll-area.tsx`, `ScrollAreaPrimitive.Viewport` **MUST** include:
```tsx
<ScrollAreaPrimitive.Viewport
  className={cn(
    "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-1",
    "[&>div]:!block [&>div]:w-full [&>div]:max-w-full overflow-x-hidden",
    className
  )}
>
```
The selector `[&>div]:!block [&>div]:w-full [&>div]:max-w-full overflow-x-hidden` overrides Radix's internal table display, forcing the container to respect standard block width constraints and allowing text ellipsis (`truncate`) to work reliably.

---

## 5. Medical EMR Scrollbar Visibility Standard (`type="always"`)

- In medical EMR / DMS interfaces, scrollbars provide vital visual orientation regarding record length and position. Clinicians must know immediately if a record has more pages or visits below the fold.
- Never use default `type="hover"` which leaves scrollbars completely invisible until user hover.
- **Mandatory Usage**:
  ```tsx
  <ScrollArea type="always" className="flex-1">
    {/* content */}
  </ScrollArea>
  ```
- **Track & Thumb Styling in `scroll-area.tsx`**:
  * Track: Include a visible border (`border-l border-slate-200/80 dark:border-slate-800`).
  * Thumb: High contrast styling (`bg-slate-400/80 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500`) with minimum thickness (`w-2.5`).

---

## 6. Tooltip Anti-Stacking & Clean Positioning Standard

### ❌ Anti-Pattern: Native `title="..."` Combined with Radix Tooltip
Never attach an HTML `title="..."` attribute to any element or button wrapped inside `<TooltipTrigger>`. Doing so causes:
1. The browser's native OS tooltip to fire after a 1-second delay.
2. The Radix `<TooltipContent>` to render immediately.
3. Both tooltips overlap and stack on top of each other ("tooltips ซ้อนกัน"), creating visual glitches and illegible text.

### Standard Implementation
```tsx
<TooltipProvider delayDuration={200}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="sm" className="...">
        {/* DO NOT add title="..." here */}
        <span className="truncate">{title}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent
      side="right"
      sideOffset={6}
      align="center"
      className="max-w-[280px] text-xs px-2.5 py-1.5 break-words z-50"
    >
      <p className="font-medium text-slate-800 dark:text-slate-100">{title}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 7. Single-Row Truncation & Flex Constraints Architecture

In high-density medical systems, list items, tree nodes, and headers must maintain a strict single-row layout without line breaks wrapping into bulky multiline boxes.

### The 3-Tier Flex Truncation Pattern
```tsx
{/* 1. Parent Button: w-full max-w-full box-border overflow-hidden */}
<Button
  variant="ghost"
  size="sm"
  className="w-full max-w-full box-border overflow-hidden h-7.5 px-2 justify-start font-normal text-left"
>
  {/* 2. Text Wrapper: min-w-0 flex-1 overflow-hidden */}
  <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
    {/* 3. Text Span: truncate flex-1 min-w-0 */}
    <span className="text-[12px] truncate flex-1 min-w-0">
      {documentName}
    </span>
  </div>

  {/* 4. Trailing Badges: shrink-0 so they never shrink or get displaced */}
  <div className="flex items-center gap-1 shrink-0 ml-1.5">
    <Badge className="shrink-0 text-[10px] px-1 py-0">แพทย์</Badge>
    <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0">1น.</Badge>
  </div>
</Button>
```

---

## 8. Anti-Clipping & Scrollbar Container Padding Standards

- **Thumbnail & Card Strips**:
  * Desktop width must be at least `w-48 sm:w-52 md:w-56` (192-224px) to display A4 preview cards, page numbers, titles, and vertical scrollbars comfortably.
  * Always provide right padding on scrollable containers (`pr-3.5` or `pr-4`) so that active cards and borders are never clipped under the scrollbar track.
  * Use `ring-1` with `box-border overflow-hidden` instead of heavy `ring-2` to prevent active outlines from overflowing container boundaries.

---

## 9. Mobile & Tablet Responsive Layout Standards (shadcn/ui Ergonomics)

Mobile smartphones (`< 768px`) and mobile tablets (`768px - 1024px`) require specialized ergonomics to guarantee clinical readability and avoid viewport breakage:

### 9.1 Responsive Slide-Over Sheets (`@/components/ui/sheet`)
- **Never render persistent sidebars on mobile screens**: Sidebars on `< 768px` crush the central reading canvas.
- Convert sidebars to overlay sheets:
  * Left Navigation Sheet: `<SheetContent side="left" className="p-0 w-80 sm:w-[340px] max-w-full">`
  * Right Thumbnail Sheet: `<SheetContent side="right" className="p-0 w-72 max-w-[85vw] flex flex-col">`
- **Accessibility Rule**: Every `<SheetContent>` MUST include an accessible title:
  ```tsx
  <SheetTitle className="sr-only">เมนูประวัติและเอกสาร</SheetTitle>
  ```
- **Auto-Dismiss on Action**: Selecting any leaf item or thumbnail inside a sheet must execute both selection and sheet dismissal:
  ```tsx
  onSelectDocument={(id) => {
    onSelectDocument(id);
    setMobileDrawerOpen(false);
  }}
  ```

### 9.2 Viewport Stability & Anti-Overflow Protection
- **Root Screen Wrapper**:
  * Use `h-screen w-screen overflow-hidden` (or `h-dvh w-dvw`) to lock viewport boundaries and prevent mobile browser address bar jumps.
- **Preventing Horizontal Window Blowout**:
  * In narrow viewports (360px - 414px), always add `min-w-0 flex-1` on text containers containing `truncate`. Without `min-w-0`, long unbroken strings force mobile browsers to trigger horizontal scrolling.

### 9.3 High-Density Single-Row Mobile Toolbars
- **No Multiline Toolbar Stacking**: Wrapping toolbar buttons into multiple rows eats up critical vertical document canvas height on mobile devices.
- **Horizontal Scroll Standard**:
  Use `overflow-x-auto no-scrollbar` on the toolbar container:
  ```tsx
  <div className="h-10 sm:h-11 px-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-1.5 select-none">
  ```
  Essential controls stay accessible via a natural horizontal thumb glide without disrupting layout.

### 9.4 Touch Target Sizing & Ergonomic Spacing
- Minimum touch target area for interactive mobile buttons is **36px - 44px**.
- Use `h-8 w-8` minimum with `p-1.5` or `p-2`, or `h-9` on mobile viewports.
- Maintain a minimum `gap-1.5` between adjacent icon buttons to prevent misclicks on touchscreens.
