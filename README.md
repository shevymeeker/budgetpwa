# ExpenseOwl

A simple, self-hosted expense tracking PWA with monthly pie-chart visualization and cashflow tracking.

Single-user, no-frills expense tracking for home lab deployments. No budgeting, no accounts -- just fast expense logging with a clean dashboard.

## Features

- Quick expense/income add (date, amount, category required)
- Recurring transactions (daily, weekly, monthly, yearly)
- Custom categories, 30 currency symbols, configurable billing cycle start date
- Optional tags for classification
- Dashboard with category pie chart and cashflow indicator
- Table view for detailed expense listing
- CSV import/export for data portability
- Light/dark/system themes
- PWA support -- installable on desktop and mobile
- Self-contained binary with embedded static assets (no internet needed)
- Storage backends: JSON (default) or PostgreSQL

## Quick Start

### Docker (recommended)

```bash
docker run -d --name expenseowl \
  -p 8080:8080 \
  -v expenseowl:/app/data \
  tanq16/expenseowl:main
```

### Docker Compose

```yaml
services:
  expenseowl:
    image: tanq16/expenseowl:main
    restart: unless-stopped
    ports:
      - 8080:8080
    volumes:
      - ./data:/app/data
```

### Build from Source

```bash
go build ./cmd/expenseowl
./expenseowl
```

Open `http://localhost:8080` in your browser.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `STORAGE_TYPE` | `json` | `json` or `postgres` |
| `STORAGE_URL` | `data` | Directory path (json) or connection URL (postgres) |
| `STORAGE_USER` | | PostgreSQL username |
| `STORAGE_PASS` | | PostgreSQL password |
| `STORAGE_SSL` | `disable` | `disable`, `require`, `verify-full`, `verify-ca` |

Copy `.env.example` to `.env` and edit as needed.

### User Defaults

Edit `user-defaults.json` to set initial categories, currency, start date, and theme. These are applied on first run only -- use the Settings page (`/settings`) after that.

## PWA Installation

- **Desktop**: Click the install icon in your browser's address bar
- **iOS**: Safari > Share > "Add to Home Screen"
- **Android**: Chrome menu > "Install"

## Usage

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/` | Pie chart + cashflow summary |
| Table | `/table` | Chronological expense list |
| Settings | `/settings` | Categories, currency, import/export, recurring transactions |

### Conventions

- Expenses are negative values, income/gains are positive
- Dates stored as UTC RFC3339; frontend auto-adds local time
- CSV import requires columns: `name`, `category`, `amount`, `date` (YYYY-MM-DD)

## Security

No authentication is built in. Deploy behind a reverse proxy (Nginx Proxy Manager, Authelia, etc.) if exposing beyond localhost.
