# Example requirement: E-commerce platform for Malaysian SMEs

Pass this file to `generate.sh` to see the framework auto-customize:

```bash
bash generate.sh --from examples/ecommerce-sme.md
```

---

## Product

Build a multi-tenant e-commerce platform targeted at Malaysian small and medium enterprises. Each merchant gets their own branded storefront, product catalog, and order dashboard.

## Core modules

1. **Merchant onboarding** — SSM verification, bank account linking for payouts, tier-based pricing (free / pro / enterprise).
2. **Product catalog** — SKU management, multi-variant (size/color), inventory sync, image optimization.
3. **Shopping cart & checkout** — Guest + account checkout, cart persistence, shipping calculator (Pos Laju, J&T, Lalamove for same-day).
4. **Payments** — Stripe for card payments, iPay88 for local bank transfers, Touch 'n Go eWallet, Boost.
5. **Order management** — Status pipeline (pending → paid → packed → shipped → delivered), automated SMS + email notifications, returns handling.
6. **Delivery tracking** — Webhook integration with courier APIs, customer-facing tracking page.
7. **Analytics dashboard** — Revenue, best sellers, conversion rate, abandoned cart recovery.

## Tech stack

- Frontend: Next.js 14 (App Router) + Tailwind + shadcn/ui
- Backend: Go Fiber (v2) microservices
- Database: PostgreSQL 16 (primary) + Redis (sessions, cart, rate limits)
- Search: Meilisearch for product search
- Queue: NATS JetStream for async jobs (email, webhooks, inventory sync)
- Storage: Cloudflare R2 for product images
- Infra: Kubernetes on AWS EKS, Terraform-managed
- Observability: OpenTelemetry → Grafana Cloud, Sentry for errors

## Non-functional requirements

- Sub-200ms p95 API latency
- 99.9% uptime SLA (pro tier)
- PCI-DSS compliance scope kept minimal (Stripe-hosted card fields)
- PDPA (Malaysia's Personal Data Protection Act) compliance — data residency in Singapore region
- Mobile-first — 70% of Malaysian traffic is mobile
- Trilingual support: Bahasa Malaysia, English, Chinese

## Out of scope (for v1)

- B2B wholesale pricing tiers
- Marketplace-style multi-vendor per storefront
- Native mobile app (PWA only for v1)
