# CLAUDE.md — DOKON Scooter Rental Management

This file is the single source of truth for AI assistants working on this repository.
Read this file completely before writing any code.

-----

## Project Overview

**DOKON** is a web-based internal tool for managing scooter rentals to couriers.
Single admin use. No multi-user auth required for v1.

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** recharts (via shadcn ChartContainer)
- **Backend:** Supabase (PostgreSQL + Storage + Edge Functions)
- **PDF Generation:** pdfmake (browser-side, no server needed)
- **Image Compression:** browser-image-compression (client-side, before Supabase Storage upload)
- **Notifications:** Telegram Bot API
- **Hosting:** Vercel (https://drent-jakromovs-projects.vercel.app | custom: https://www.bormibor.uz)
- **Language:** JavaScript (no TypeScript)
- **UI Language:** Russian (все надписи на русском языке)

-----

## Repository Structure

```
dokon/
├── CLAUDE.md
├── components.json              # shadcn/ui config
├── .env.example
├── .gitignore
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
│
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css                # Tailwind directives + shadcn CSS variables
    │
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── Couriers.jsx
    │   ├── Scooters.jsx
    │   ├── Rentals.jsx
    │   ├── NewRental.jsx        # multi-step wizard
    │   ├── RentalDetail.jsx     # payment form inline, photo upload, PDF buttons
    │   ├── Login.jsx            # Phase 8: single-admin login
    │   ├── Settings.jsx         # Phase 9: pricing + password change
    │   └── Expenses.jsx         # Phase 10: expense tracking
    │
    ├── components/
    │   ├── Layout.jsx           # shadcn Sidebar + SidebarInset + Breadcrumb header
    │   ├── AuthGuard.jsx        # Phase 8: route protection
    │   ├── StatusBadge.jsx      # Russian status labels
    │   ├── PhotoUpload.jsx      # upload to Supabase Storage with compression, delete photos
    │   ├── SearchCombobox.jsx   # shared searchable combobox (Phase 17)
    │   └── ui/                  # shadcn/ui components
    │       ├── avatar.jsx
    │       ├── badge.jsx
    │       ├── breadcrumb.jsx
    │       ├── button.jsx
    │       ├── card.jsx
    │       ├── chart.jsx        # ChartContainer, ChartTooltip, ChartTooltipContent
    │       ├── dialog.jsx
    │       ├── dropdown-menu.jsx
    │       ├── input.jsx
    │       ├── label.jsx
    │       ├── pagination.jsx
    │       ├── progress.jsx
    │       ├── select.jsx
    │       ├── separator.jsx
    │       ├── sheet.jsx
    │       ├── sidebar.jsx      # full shadcn sidebar kit
    │       ├── skeleton.jsx
    │       ├── table.jsx
    │       └── tooltip.jsx
    │
    ├── lib/
    │   ├── supabase.js          # supabase client init
    │   ├── telegram.js          # sendTelegramMessage + buildReminderText
    │   ├── pdfTemplates.js      # pdfmake document definitions (rentalAgreementDoc, doverenostDoc)
    │   ├── printPdf.js          # printPdf(docDefinition) — opens PDF in new tab
    │   ├── agreementNumber.js   # generateAgreementNumber() — DOK-YYYY-NNNN
    │   ├── tariffRates.js       # TARIFF_RATES + calcTotalCharged()
    │   └── utils.js             # cn(), formatUzPhone(), formatAmount()
    │
    └── hooks/
        ├── useRentals.js        # useRentals(filters) + useRental(id)
        ├── useCouriers.js
        ├── useScooters.js
        └── use-mobile.jsx       # useIsMobile() — required by shadcn sidebar
```

-----

## Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TELEGRAM_BOT_TOKEN=
VITE_TELEGRAM_CHAT_ID=
```

Never commit `.env`. Always use `.env.example` as the template.

-----

## Database Schema

### couriers

```sql
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
full_name          text NOT NULL
passport_no        text NOT NULL
phone              text NOT NULL
license_no         text
license_issue_date date
birth_country      text
birth_city         text
address            text
avatar_url         text                    -- public URL from courier-photos Storage bucket
created_at         timestamp DEFAULT now()
```

### scooters

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
model        text NOT NULL
vin          text NOT NULL UNIQUE
plate        text NOT NULL UNIQUE
status       text NOT NULL DEFAULT 'available' -- available | rented | maintenance
created_at   timestamp DEFAULT now()
```

### rentals

```sql
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
agreement_no       text NOT NULL UNIQUE   -- format: DOK-YYYY-NNNN
courier_id         uuid REFERENCES couriers(id)
scooter_id         uuid REFERENCES scooters(id)
tariff             text NOT NULL          -- daily | weekly | monthly
start_date         date NOT NULL
end_date           date NOT NULL
status             text NOT NULL DEFAULT 'active'  -- active | completed | cancelled
license_no         text NOT NULL
license_issue_date date NOT NULL
photos             text[] DEFAULT '{}'
agreed_price       numeric                -- custom price set at rental creation; overrides calcTotalCharged
created_at         timestamp DEFAULT now()
```

### payments

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
rental_id    uuid REFERENCES rentals(id)
amount       numeric NOT NULL
method       text NOT NULL   -- cash | transfer
paid_at      date NOT NULL
note         text
created_at   timestamp DEFAULT now()
```

### settings

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
key          text NOT NULL UNIQUE
value        text NOT NULL
updated_at   timestamp DEFAULT now()
```

Seed with:

```sql
INSERT INTO settings (key, value) VALUES
  ('username', 'jahongir'),
  ('password', 'jahongir97'),
  ('daily_rate', '50000'),
  ('weekly_rate', '300000'),
  ('monthly_rate', '1000000');
```

### expenses

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
amount       numeric NOT NULL
category     text NOT NULL   -- maintenance | fuel | repair | other
description  text NOT NULL
spent_at     date NOT NULL
created_at   timestamp DEFAULT now()
```

### Supabase Storage Buckets

| Bucket | Access | Used for |
|--------|--------|----------|
| `courier-photos` | public | Courier avatar photos (compressed to ≤0.3 MB, max 400px) |
| `rental-photos`  | public | Rental inspection/handover photos (compressed to ≤0.5 MB, max 1280px) |

RLS policies (run once in SQL editor):
```sql
CREATE POLICY "courier-photos: allow all" ON storage.objects
  FOR ALL TO public
  USING (bucket_id = 'courier-photos')
  WITH CHECK (bucket_id = 'courier-photos');

CREATE POLICY "rental-photos: allow all" ON storage.objects
  FOR ALL TO public
  USING (bucket_id = 'rental-photos')
  WITH CHECK (bucket_id = 'rental-photos');
```

### Supabase Trigger (run once in SQL editor)

```sql
CREATE OR REPLACE FUNCTION update_scooter_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE scooters SET status = 'rented' WHERE id = NEW.scooter_id;
  ELSIF NEW.status IN ('completed', 'cancelled') THEN
    UPDATE scooters SET status = 'available' WHERE id = NEW.scooter_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rental_status_trigger
AFTER INSERT OR UPDATE ON rentals
FOR EACH ROW EXECUTE FUNCTION update_scooter_status();
```

-----

## Input Formatting Conventions

### Phone numbers
All phone inputs use Uzbek format mask: `+998 XX XXX XX XX`

Use `formatUzPhone(val)` from `@/lib/utils` — strips non-digits, then formats:
```js
onChange={(e) => setForm((p) => ({ ...p, phone: formatUzPhone(e.target.value) }))}
```
Apply in: Couriers form, NewRental quick-add courier form.

### Money amounts
All monetary inputs display values with space thousands separator: `1 500 000`

Use `formatAmount(raw)` from `@/lib/utils` — raw digits string → formatted display:
```js
value={formatAmount(form.amount)}
onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/\D/g, '') }))}
```
- State stores **raw digit string** (no spaces)
- `value` prop uses `formatAmount` for display only
- On submit: `Number(form.amount)` converts cleanly
- Use `inputMode="numeric"` (not `type="number"`) so formatting isn't blocked
Apply in: Expenses amount, Settings rates, RentalDetail payment amount.

### Auto-uppercase fields
Passport No, License No, Plate, VIN — auto-uppercase as user types:
```js
const upper = ['passport_no', 'license_no', 'plate', 'vin'].includes(name)
setForm((prev) => ({ ...prev, [name]: upper ? value.toUpperCase() : value }))
```

### Search / list inputs
Courier and scooter search in New Rental wizard show **no results by default**.
List only appears after the user starts typing. Show "Type to search..." prompt when empty.

-----

## Currency

All monetary values must be displayed in UZS (Uzbek Som).

- Format: `1,500,000 UZS`
- Use this format everywhere: dashboard, payments, expenses, settings, PDF documents
- No other currency should appear anywhere in the app

-----

## Business Rules

### Tariff & Duration

- `daily` → minimum 3 days. end_date = start_date + N days (N+1 inclusive — 1 buffer day for handover)
- `weekly` → end_date = start_date + 8 (9 days inclusive: 7 use + 1 return + 1 paperwork)
- `monthly` → end_date = start_date + 31 (32 days inclusive: 30 use + 1 return + 1 paperwork)

### Agreement Number

- Format: `DOK-{YYYY}-{NNNN}` (e.g. DOK-2026-0001)
- Sequence is per year, resets each year
- Query MAX agreement_no for current year to get next number

### Renewal

- Renewal = new rental record (new agreement_no, new dates)
- Previous rental → status = `completed`
- New PDFs generated automatically
- Same courier + scooter pre-filled in new rental form

### Payment Balance

- `total_charged` = `rental.agreed_price` if set, otherwise `calcTotalCharged(tariff, start_date, end_date)`
- **Daily price** in NewRental Step 3 is computed as `days × TARIFF_RATES.daily` (not from date diff), because end_date includes a buffer day that should not be billed
- `total_paid` = SUM of payments for that rental
- `balance` = total_charged - total_paid
- If balance > 0 → show as overdue warning

### Custom Rental Price (`agreed_price`)

- When creating a rental (Step 3), the price input defaults to `calcTotalCharged()` for the selected tariff/duration
- Admin can override this price freely (e.g. 300,000 UZS weekly → enter 250,000 UZS)
- A "сбросить" link resets to the default tariff price
- The entered price is saved as `agreed_price` in the `rentals` table
- `RentalDetail` reads `rental.agreed_price ?? calcTotalCharged(...)` — backward-compatible with old rentals

-----

## Pages & Features

### Dashboard (`/`)

- 7 stat cards: Всего скутеров, Арендовано, Доступно, Обслуживание, Выручка за месяц, Расходы за месяц, Чистый доход
- BarChart: Выручка за 14 дней (recharts via shadcn ChartContainer, data from `payments` grouped by `paid_at`)
- PieChart: Расходы по категориям (current month `expenses` grouped by category)
- Table: Истекают скоро (rentals ending in ≤ 2 days) + Send Telegram Reminder button
- Table: Задолженности (rentals with balance > 0) — uses `agreed_price ?? calcTotalCharged(...)` for balance
- Table: Активные аренды

### Couriers (`/couriers`)

- List with: **circular avatar**, ФИО, Телефон, active rental count — uses shadcn `Avatar`/`AvatarImage`/`AvatarFallback`
- Add / Edit courier: **avatar photo upload** (at top of form), full_name, passport_no, phone, **address**, license_no, license_issue_date, birth_country, birth_city
- Avatar upload: compressed client-side (`maxSizeMB: 0.3, maxWidthOrHeight: 400`) via `browser-image-compression`, stored in `courier-photos` bucket, public URL saved to `couriers.avatar_url`
- birth_country: searchable combobox, options from `restcountries.com/v3.1/all?fields=name`
- birth_city: searchable combobox (disabled until country chosen), options from `countriesnow.space/api/v0.1/countries/cities` (POST)
- `nationality` field removed — not needed

### Scooters (`/scooters`)

- List with: model, plate, VIN, status badge
- Add / Edit scooter (model, vin, plate, status)

### New Rental (`/rentals/new`) — 5-step wizard

1. Select or quick-add courier — **SearchCombobox dropdown** (not list+button). Quick-add modal includes address field and **avatar photo upload**. Selected courier shown as a card with **circular avatar**, name, phone.
1. Select available scooter — **SearchCombobox dropdown**, shows `plate – model` options
1. Fill: tariff, days (if daily, min 3), start_date. **Price input** auto-fills from tariff rate, admin can override. Shows "сбросить" link if changed.
1. Review summary (includes Стоимость row) → confirm → create rental + save `agreed_price`
1. Success screen with agreement number → navigate to rental detail

### Rental Detail (`/rentals/:id`)

- All rental info
- **Edit Rental** button (Pencil icon, active rentals only) → dialog to fix: tariff, days (daily), start_date, end_date (auto), agreed_price, license_no, license_issue_date
- Payment history + Add payment (amount, method, paid_at, note)
- Photo gallery
- Print Rental Agreement / Print Doverenost buttons
- Complete Rental button
- Renew button (pre-fills new rental form)

#### Edit Rental Dialog (`computeEndDate`)

```js
function computeEndDate(tariff, start, days) {
  const d = new Date(start)  // UTC parse — matches NewRental.jsx
  if (tariff === 'daily') d.setDate(d.getDate() + Number(days))
  else if (tariff === 'weekly') d.setDate(d.getDate() + 8)
  else if (tariff === 'monthly') d.setDate(d.getDate() + 31)
  return d.toISOString().split('T')[0]
}
```

**Always use `new Date(dateString)` (UTC parse), never `new Date(dateString + 'T00:00:00')` (local parse).** In UTC+5 (Tashkent), local midnight parses as UTC previous day, causing `toISOString()` to return one day early.

### Rentals List (`/rentals`)

- Filter by status, search by courier name or plate

### Login (`/login`) — Phase 8

- Логин + Пароль fields + Войти button
- Default credentials: `username = jahongir`, `password = jahongir97`
- On submit: query `settings` table, compare credentials
- On success: save `dokon_authed = true` to localStorage → redirect to `/`
- On fail: show error "Неверный логин или пароль"

### Settings (`/settings`) — Phase 9

Two sections:

1. **Pricing** — edit daily / weekly / monthly rates (UZS), Save button → updates `settings` table
2. **Change Password** — new password + confirm (no current password required), Save → update `settings` table

### Expenses (`/expenses`) — Phase 10

- Add expense form: amount (UZS), category (select), description, date
- Expenses list: date, category badge, description, amount in UZS
- Filter by category + month
- Summary card at top: total expenses this month (UZS)
- Delete expense (with confirm dialog)

-----

## PDF Documents (pdfmake)

Both documents are generated client-side using pdfmake. Open in new tab for printing.

### Rental Agreement

Full 8-section legal document matching official DOKON TEAM template:
- **Section 1:** Parties — ООО «DOKON TEAM» MCHJ + courier (full_name, passport_no, address)
- **Section 2:** Subject — scooter (model, Цвет: Чёрный static, plate, VIN)
- **Section 3:** Terms — tariff checkboxes (`☑`/`☐`), agreed_price, start/end dates
- **Sections 4–8:** Static legal clauses
- Signatures: Арендодатель + Арендатор (courier.full_name)

Helper functions in `pdfTemplates.js`:
- `formatDateShort(dateStr)` → `«14» марта 2026 г.`
- `cb(checked)` → `☑` / `☐`
- `fmtPrice(amount)` → `Number(amount).toLocaleString('ru-RU')`

### Doverenost fields

courier full_name, birth_city/birth_country (Выдан: field), license_no, license_issue_date,
scooter model, plate, VIN (no engine number), Цвет: Чёрный static,
valid from/to (= rental dates), "принадлежащего ООО «DOKON TEAM» MCHJ" in opening,
stamp placeholder, signature lines

-----

## Telegram Notifications

```js
// lib/telegram.js
export async function sendTelegramMessage(text) {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
}
```

Message template:

```
🛵 <b>DOKON Reminder</b>
Courier: {full_name} | {phone}
Scooter: {model} - {plate}
Rental ends: {end_date}
Agreement: {agreement_no}

Action required: Renew or return scooter.
```

Trigger: Manual button on dashboard per expiring rental (no cron in v1).

-----

## Mobile Responsiveness

App must work on mobile browsers (phone screen).

- Sidebar: shadcn `SidebarProvider` + `Sidebar` + `SidebarInset` — mobile sheet via `Sheet` component (built into sidebar kit)
- All table wrappers: `overflow-x-auto`
- Side-by-side layouts: `flex-col md:flex-row`
- Buttons: `w-full md:w-auto`
- Cards: `grid grid-cols-2 md:grid-cols-4`
- Min font size: `text-sm` (no zoom required)
- Default styles = mobile first, `md:` = tablet+, `lg:` = desktop

-----

## Development Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server
npm run build      # production build
npm run preview    # preview production build
```

-----

## Git Workflow

- `main` → stable, production-ready only
- `feature/<description>` → new features
- `fix/<description>` → bug fixes

### Commit format

```
feat(rentals): add multi-step rental wizard
fix(pdf): correct doverenost date fields
chore(db): add scooter status trigger
```

-----

## Production

- **Live URL:** https://drent-jakromovs-projects.vercel.app (custom domain: https://www.bormibor.uz)
- **Repo:** https://github.com/sherozovich/rent-app
- **Deploy:** `npx vercel deploy --prod` from project root
- **Node version:** 20.x (set in Vercel project settings)
- **Framework:** Vite (configured in Vercel project settings)
- **Env vars in Vercel:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Custom Domain DNS (bormibor.uz)

Registrar DNS records (webspace.uz or similar):
- `A` record: `bormibor.uz` → `76.76.21.21` (Vercel apex)
- `CNAME` record: `www` → `cname.vercel-dns.com`

Both `bormibor.uz` and `www.bormibor.uz` are added to Vercel project `drent`.
Vercel redirects apex → `www.bormibor.uz` automatically.

### Dev / Prod DB Separation

- **Local dev** (`.env`) → `lzqccynljtfidgkjoojr.supabase.co` (dev Supabase)
- **Vercel prod build** → `dzknpbalwaghbvrzbssr.supabase.co` (prod Supabase, set in Vercel dashboard)
- **NEVER run** `vercel env pull` — it creates `.env.local` which overrides `.env` and points local to prod DB

Current state: **v1.0 — production-ready.** All core features complete and deployed.

-----

## Development Phases

|Phase|Scope                                                  |Status    |
|-----|-------------------------------------------------------|----------|
|1    |Supabase setup + Layout + Couriers CRUD + Scooters CRUD|Done      |
|2    |New Rental wizard + Rentals list + Rental detail       |Done      |
|3    |Payment tracking (add payment, balance display)        |Done      |
|4    |PDF generation (Rental Agreement + Doverenost)         |Done      |
|5    |Photo upload (Supabase Storage)                        |Done      |
|6    |Telegram notifications (manual button on dashboard)    |Done      |
|7    |Dashboard analytics + stat cards                       |Done      |
|8    |Authentication (single-admin, localStorage session)    |Done      |
|9    |Settings page (pricing + password change)              |Done      |
|10   |Expenses page + dashboard integration                  |Done      |
|11   |Production-ready overhaul: shadcn sidebar, recharts dashboard, full Russian UI, UX polish|Done|
|12   |Courier address field, SearchCombobox selection in wizard, custom agreed_price per rental|Done|
|13   |Courier avatar upload + compression, avatar in list + NewRental card, rental photo compression|Done|
|14   |End-date buffer: +2 days for weekly/monthly, +1 day for daily (paperwork/handover day)|Done|
|15   |Bug fixes: dashboard agreed_price, payments layout, quick-add avatar, rental-photos bucket|Done|
|16   |PDF rewrite (rental agreement + doverenost), edit rental dialog, UTC date fix, dev/prod DB separation|Done|
|17   |Performance & stability: remove unbounded DB query, lazy loading, error guards, useDeferredValue, shared SearchCombobox|Done|

New features and fixes go on `feature/<description>` or `fix/<description>` branches, then PR to main.

-----

## UI Patterns

### Layout
- `Layout.jsx` uses shadcn `SidebarProvider` + `AppSidebar` + `SidebarInset`
- Nav groups defined in `navGroups` array (Основное / Финансы / Система)
- Active route highlighting via `NavLink` + `SidebarMenuButton isActive` prop
- Breadcrumb in sticky header auto-derives page label from `routeLabels` map
- Logout button top-right in header

### Page headers
All pages use consistent header style:
```jsx
<div>
  <h1 className="text-xl font-semibold text-gray-900">Название</h1>
  <p className="text-sm text-gray-500 mt-1">Подзаголовок</p>
</div>
```

### Table wrappers
All data tables wrapped in:
```jsx
<div className="rounded-xl border border-gray-200 overflow-x-auto bg-white shadow-sm">
  <Table>
    <TableHeader><TableRow className="bg-gray-50">...</TableRow></TableHeader>
    ...
  </Table>
</div>
```

### Dashboard charts
- Bar chart (revenue): `ChartContainer` + recharts `BarChart` + `Bar`
- Pie chart (expenses): `ChartContainer` + recharts `PieChart` + `Pie` + `Cell`
- Chart configs use Russian labels: `{ amount: { label: 'Выручка', color: 'var(--primary)' } }`

### Tariff labels (Russian)
Always use this map when displaying tariffs:
```js
{ daily: 'Суточный', weekly: 'Еженедельный', monthly: 'Ежемесячный' }
```

### Payment method labels (Russian)
```js
{ cash: 'Наличные', transfer: 'Перевод' }
```

### Expense category labels (Russian)
```js
{ maintenance: 'Обслуживание', fuel: 'Топливо', repair: 'Ремонт', other: 'Прочее' }
```

### SearchCombobox
Custom component used for: birth_country, birth_city (Couriers + NewRental quick-add), **courier selection** (NewRental Step 1), **scooter selection** (NewRental Step 2).
- Shared component at `src/components/SearchCombobox.jsx` — import from there
- Uses `useRef` for click-outside detection
- Shows filtered dropdown max 80 results
- `onMouseDown e.preventDefault()` prevents blur-before-click
- After selection, shows a summary card below (selected courier or scooter details)

### Image Compression (browser-image-compression)
All file uploads compress images client-side before sending to Supabase Storage.

```js
import imageCompression from 'browser-image-compression'

// Courier avatars (Couriers.jsx)
const AVATAR_COMPRESSION = { maxSizeMB: 0.3, maxWidthOrHeight: 400, useWebWorker: true }

// Rental photos (PhotoUpload.jsx)
const COMPRESSION_OPTIONS = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true }
```

Pattern:
```js
const compressed = await imageCompression(file, options)
await supabase.storage.from('bucket-name').upload(path, compressed, { upsert: true })
const { data } = supabase.storage.from('bucket-name').getPublicUrl(path)
```

### Courier Avatar (shadcn Avatar)
Couriers carry an `avatar_url` stored in `courier-photos` Supabase Storage bucket.
Always render with `Avatar`/`AvatarImage`/`AvatarFallback` — fallback shows first letter of `full_name`.
```jsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

<Avatar className="w-8 h-8">
  <AvatarImage src={courier.avatar_url || undefined} alt={courier.full_name} />
  <AvatarFallback className="text-xs">{courier.full_name?.[0] ?? '?'}</AvatarFallback>
</Avatar>
```
Used in: Couriers list table, Couriers add/edit form (preview), NewRental Step 1 selected-courier card.

-----

## AI Assistant Rules

1. Read this file completely before writing any code
1. Never use TypeScript — this project is plain JavaScript
1. Never create a separate backend — Supabase handles all data operations
1. Always use Tailwind utility classes — no inline styles, no CSS modules
1. Use shadcn/ui components where available before building custom ones
1. Mobile-first — write mobile styles first, then add `md:` overrides
1. Read the relevant file before editing it
1. Minimal changes — only change what is needed
1. One logical change per commit
1. Never push directly to `main`
1. After adding a new pattern or library, update this CLAUDE.md
1. All monetary values must be in UZS format: `1,500,000 UZS`

-----

## Out of Scope (v1)

- Multi-user authentication
- Customer-facing portal
- Online payment integration
- Automatic scheduled notifications (cron)
- Mobile app (Flutter or React Native)
