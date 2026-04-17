# Architecture — Inventory App

## Backend

Entities: Product, Supplier.

## Frontend

Screens: dashboard, products.

## Integration

No external services yet.

## Acceptance Criteria

### Feature: Low stock alert

- Given a product with stock below threshold
- When an admin views the dashboard
- Then the product appears in the Low Stock panel with a red badge

Related: `GET /api/v1/products/low-stock`, see `docs/decisions/001-auth-approach.md`.

### Feature: Bulk stock adjustment

- Given an admin with 50+ products to update
- When they upload a CSV
- Then each row applies atomically

Related: `POST /api/v1/products/bulk`, `docs/decisions/002-datastore.md`.
