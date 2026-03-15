# CLAUDE.md — AI Assistant Guide for claude_rentapp

This file provides context and conventions for AI assistants (Claude and others) working on this repository.

## Project Overview

**claude_rentapp** is a rental application designed to facilitate property listing, tenant management, and rental workflows. This document will be updated as the project evolves.

> **Note:** This repository is currently in its initial state. This CLAUDE.md serves as the foundational guide and will be expanded as code is added.

---

## Repository Structure (Planned)

Once development begins, the expected structure is:

```
claude_rentapp/
├── CLAUDE.md              # This file
├── README.md              # User-facing documentation
├── .env.example           # Environment variable template
├── .gitignore
│
├── backend/               # Server-side application
│   ├── src/
│   │   ├── models/        # Database models/schemas
│   │   ├── routes/        # API route handlers
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/     # Auth, validation, error handling
│   │   └── utils/         # Shared utilities
│   ├── tests/             # Backend tests
│   └── package.json
│
├── frontend/              # Client-side application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # State management
│   │   ├── api/           # API client layer
│   │   └── utils/         # Frontend utilities
│   ├── tests/
│   └── package.json
│
└── docs/                  # Additional documentation
```

---

## Git Workflow

### Branching Convention

- **Main branch**: `main` — stable, production-ready code only
- **Feature branches**: `feature/<short-description>`
- **Bug fixes**: `fix/<short-description>`
- **Claude-initiated branches**: `claude/<description>-<SESSION_ID>` (auto-generated)

### Commit Messages

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(auth): add JWT-based authentication for tenants
fix(listings): correct pagination offset calculation
docs(api): document /properties endpoint parameters
test(models): add unit tests for Lease model
```

### Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Always reference related issues in the PR description
- Ensure all tests pass before requesting review
- Update CLAUDE.md if you introduce new patterns, tooling, or conventions

---

## Development Commands

> These will be confirmed once the tech stack is finalized. Update this section accordingly.

```bash
# Install dependencies (run in backend/ or frontend/)
npm install

# Start development servers
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

---

## Environment Configuration

Copy `.env.example` to `.env` and fill in values before running locally. **Never commit `.env` files.**

Expected environment variables (update as the project grows):

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=

# Authentication
JWT_SECRET=
JWT_EXPIRES_IN=7d

# External Services (if applicable)
STORAGE_BUCKET=
EMAIL_SERVICE_API_KEY=
```

---

## Code Conventions

### General

- Prefer clarity over cleverness — code is read more than it is written
- Functions should do one thing; keep them short and focused
- Name variables and functions descriptively; avoid abbreviations
- Avoid premature abstraction — don't create helpers for one-off logic

### TypeScript / JavaScript

- Use TypeScript wherever possible for type safety
- Prefer `const` over `let`; avoid `var`
- Use async/await over raw Promises
- Validate all external inputs (user input, API responses) at system boundaries
- Do not validate internal data that is already type-safe

### API Design

- Follow RESTful conventions for HTTP endpoints
- Use plural nouns for resource endpoints: `/properties`, `/tenants`, `/leases`
- Return consistent JSON response shapes:
  ```json
  { "data": ..., "error": null }
  { "data": null, "error": { "message": "..." } }
  ```
- Use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 422, 500)

### Database

- All schema changes must be done via migrations — never modify the database manually
- Migration files are append-only; do not edit existing migrations
- Use transactions for operations that modify multiple tables

### Testing

- Write tests for all business logic and API endpoints
- Prefer unit tests for pure functions and integration tests for routes
- Test file naming: `*.test.ts` co-located with source, or in a `tests/` directory
- Aim for meaningful coverage, not 100% coverage for its own sake

---

## Security Practices

- Never hardcode secrets, credentials, or API keys — use environment variables
- Sanitize and validate all user-supplied input before use
- Apply authentication middleware to all protected routes
- Use parameterized queries / ORM methods — never interpolate user input into SQL
- Set appropriate CORS policies; do not use `origin: *` in production
- Keep dependencies up to date; audit regularly with `npm audit`

---

## Domain Concepts

Key entities in a rental application context:

| Entity | Description |
|--------|-------------|
| **Property** | A rentable unit (apartment, house, room) |
| **Listing** | A public advertisement for a property |
| **Tenant** | A person renting or applying to rent a property |
| **Landlord** | A person or organization that owns/manages properties |
| **Application** | A tenant's request to rent a property |
| **Lease** | A signed rental agreement between landlord and tenant |
| **Payment** | A rent or deposit transaction |
| **Maintenance Request** | A tenant's report of a repair need |

---

## AI Assistant Instructions

When working in this repository as an AI assistant:

1. **Read before editing** — always read the relevant files before modifying them
2. **Minimal changes** — only change what is needed; do not refactor unrelated code
3. **Follow existing patterns** — match the style and structure already present in the codebase
4. **Update this file** — if you introduce new tooling, patterns, or conventions, update CLAUDE.md
5. **Test your changes** — run the test suite after making code changes; do not skip
6. **Commit atomically** — one logical change per commit with a clear message
7. **Do not push to `main`** — always work on a feature or fix branch
8. **Ask before destructive operations** — confirm before deleting files, dropping tables, or force-pushing

---

## Updating This File

This file should be updated whenever:

- A new technology, library, or tool is added to the project
- A new architectural pattern is established
- Development workflows or commands change
- New domain concepts are introduced
- Conventions evolve based on team decisions

Keep this file accurate and concise — it is the first thing an AI assistant reads.
