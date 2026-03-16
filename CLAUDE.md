# CLAUDE.md — DOKON Scooter Rental Management

This file is the single source of truth for AI assistants working on this repository.
Read this file completely before writing any code.

-----

## Project Overview

**DOKON** is a web-based internal tool for managing scooter rentals to couriers.
Single admin use. No multi-user auth required for v1.

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Storage + Edge Functions)
- **PDF Generation:** pdfmake (browser-side, no server needed)
- **Notifications:** Telegram Bot API
- **Hosting:** Netlify
- **Language:** JavaScript (no TypeScript)

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
    │   ├── Layout.jsx           # sidebar (desktop) + hamburger nav (mobile)
    │   ├── AuthGuard.jsx        # Phase 8: route protection
    │   ├── StatusBadge.jsx
    │   ├── PhotoUpload.jsx      # upload to Supabase Storage, delete photos
    │   └── ui/                  # shadcn/ui components
    │       ├── badge.jsx
    │       ├── button.jsx
    │       ├── card.jsx
    │       ├── dialog.jsx
    │       ├── input.jsx
    │       ├── label.jsx
    │       ├── select.jsx
    │       └── table.jsx
    │
    ├── lib/
    │   ├── supabase.js          # supabase client init
    │   ├── telegram.js          # sendTelegramMessage + buildReminderText
    │   ├── pdfTemplates.js      # pdfmake document definitions (rentalAgreementDoc, doverenostDoc)
    │   ├── printPdf.js          # printPdf(docDefinition) — opens PDF in new tab
    │   ├── agreementNumber.js   # generateAgreementNumber() — DOK-YYYY-NNNN
    │   ├── tariffRates.js       # TARIFF_RATES + calcTotalCharged()
    │   └── utils.js             # cn() helper (clsx + tailwind-merge)
    │
    └── hooks/
        ├── useRentals.js        # useRentals(filters) + useRental(id)
        ├── useCouriers.js
        └── useScooters.js
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
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
full_name    text NOT NULL
passport_no  text NOT NULL
phone        text NOT NULL
created_at   timestamp DEFAULT now()
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

## Currency

All monetary values must be displayed in UZS (Uzbek Som).

- Format: `1,500,000 UZS`
- Use this format everywhere: dashboard, payments, expenses, settings, PDF documents
- No other currency should appear anywhere in the app

-----

## Business Rules

### Tariff & Duration

- `daily` → minimum 3 days. end_date = start_date + N days - 1
- `weekly` → end_date = start_date + 6
- `monthly` → end_date = start_date + 29

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

- `total_charged` = calculated from tariff × duration (store daily/weekly/monthly rates in a config constant)
- `total_paid` = SUM of payments for that rental
- `balance` = total_charged - total_paid
- If balance > 0 → show as overdue warning

-----

## Pages & Features

### Dashboard (`/`)

- 4 stat cards: Total / Rented / Available / Maintenance scooters + Monthly revenue
- Stat cards: This month expenses + Net income (revenue - expenses)
- Table: rentals ending in ≤ 2 days (expiring soon)
- Table: rentals with balance > 0 (overdue payments)
- Table: all active rentals
- Each expiring rental has a **Send Telegram Reminder** button

### Couriers (`/couriers`)

- List with: name, phone, active rental count
- Add / Edit courier (full_name, passport_no, phone)

### Scooters (`/scooters`)

- List with: model, plate, VIN, status badge
- Add / Edit scooter (model, vin, plate, status)

### New Rental (`/rentals/new`) — 5-step wizard

1. Select or quick-add courier
1. Select available scooter
1. Fill: tariff, days (if daily, min 3), start_date, license_no, license_issue_date
1. Review summary → confirm → create rental + update scooter status
1. Print documents + upload photos + record prepayment → activate

### Rental Detail (`/rentals/:id`)

- All rental info
- Payment history + Add payment (amount, method, paid_at, note)
- Photo gallery
- Print Rental Agreement / Print Doverenost buttons
- Complete Rental button
- Renew button (pre-fills new rental form)

### Rentals List (`/rentals`)

- Filter by status, search by courier name or plate

### Login (`/login`) — Phase 8

- Username + Password fields + Login button
- Default credentials: `username = jahongir`, `password = jahongir97`
- On submit: query `settings` table, compare credentials
- On success: save `dokon_authed = true` to localStorage → redirect to `/`
- On fail: show error "Username or password incorrect"

### Settings (`/settings`) — Phase 9

Two sections:

1. **Pricing** — edit daily / weekly / monthly rates (UZS), Save button → updates `settings` table
2. **Change Password** — current password + new password + confirm, Save → verify then update `settings` table

### Expenses (`/expenses`) — Phase 10

- Add expense form: amount (UZS), category (select), description, date
- Expenses list: date, category badge, description, amount in UZS
- Filter by category + month
- Summary card at top: total expenses this month (UZS)
- Delete expense (with confirm dialog)

-----

## PDF Documents (pdfmake)

Both documents are generated client-side using pdfmake. Open in new tab for printing.

### Rental Agreement fields

agreement_no, date, courier full_name, passport_no, scooter model, VIN, plate,
tariff (checkbox), start_date, end_date, signature lines (Admin | Courier)

### Doverenost fields

courier full_name, license_no, license_issue_date, scooter model, plate, VIN,
valid from/to (= rental dates), stamp placeholder, signature lines

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

- Sidebar: `hidden md:flex` — on mobile show top navbar + hamburger menu
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

Always complete the current phase fully before starting the next.

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
