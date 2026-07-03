# MAMA SACDIYA

A multi-role B2B2C marketplace for the Somali/Mogadishu market, built with
Next.js (App Router), TypeScript, Prisma, and PostgreSQL.

Five roles share one platform: **Admin**, **Seller** (wholesaler), **Business
Buyer** (reseller — buys wholesale, sells retail), **Customer**, and **Rider**
(delivery agent). A single account can hold Customer + Business Buyer +
Seller roles at once; verification status is tracked per account, not per
role.

## Stack

- Next.js 16 (App Router, Server Actions, TypeScript)
- PostgreSQL + Prisma ORM (driver adapter: `@prisma/adapter-pg`)
- Tailwind CSS
- Cookie/JWT session auth (phone + password + OTP)

Payments (WaafiPay, EVC Plus, Flutterwave) are **mocked** — checkout marks
them as instantly verified (or lets you simulate a failure for testing the
3-attempt lockout). Cash on Delivery is a fully real flow. Swap in real
gateway calls inside `src/actions/checkout.ts` when you're ready to go live.

## Getting started

1. Create a Postgres database and set `DATABASE_URL` in `.env` (see `.env`
   for the format already used in development).
2. Install dependencies and generate the Prisma client:

   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy   # or `migrate dev` in development
   ```

3. Seed demo data (creates one account per role):

   ```bash
   npx tsx prisma/seed.ts
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

## Demo accounts (password: `password123`)

| Role                    | Phone           |
| ----------------------- | --------------- |
| Admin                   | +252610000001   |
| Seller (approved)       | +252610000002   |
| Business Buyer (approved) | +252610000003 |
| Customer                | +252610000004   |
| Rider (approved, online)| +252610000005   |
| Seller (pending review) | +252610000006   |

## How it's organized

- `prisma/schema.prisma` — full data model (users, profiles, products,
  orders, payments, payouts, disputes, reviews, notifications, delivery
  rates, audit log).
- `src/actions/*` — Server Actions containing all business logic and
  permission checks (auth, onboarding, products, cart, checkout, orders,
  rider assignment, reviews, disputes, wishlist, admin).
- `src/lib/lifecycle.ts` — lazy background-job style helpers (payout release
  after the 48h no-dispute window, dispute auto-escalation past SLA, delivery
  fee calculation) that run opportunistically when relevant pages load, since
  there's no cron worker in this deployment.
- `src/app/dashboard/{seller,business-buyer,rider,admin}` — role dashboards.
  Seller and Business Buyer "My Store" share the same underlying components
  (`src/components/vendor/*`) since their business rules are identical.
- `src/app/api/files/[filename]` — private-document server, gates ID/license
  uploads to the uploader and Admins only.

## Notable business rules enforced server-side (not just hidden UI)

- Wholesale (Seller) products are only reachable by verified Business Buyers;
  retail (Business Buyer store) products are the only thing Customers can
  see — enforced with real checks in both API/actions and page loading, not
  just hidden nav links.
- Order status is forward-only (`PENDING → CONFIRMED → SHIPPED → DELIVERED`),
  cancellation requires a reason and is only allowed from `PENDING`/`CONFIRMED`.
- Commission is auto-calculated (8%) and never editable by vendors.
- A buyer only sees their rider's name/phone once the order reaches
  `PICKED_UP` — never earlier.
- Adding a stricter role (Seller/Business Buyer) to an already-approved
  Customer account re-applies pending business verification to the whole
  account.
