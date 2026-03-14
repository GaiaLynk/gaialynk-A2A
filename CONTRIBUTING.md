# Contributing to GAIALYNK Phase 0

Thanks for your interest in contributing.

## Getting Started

1. Fork this repository.
2. Create a feature branch from `main`.
3. Make focused changes with tests.
4. Open a pull request with clear context.

## Development Commands

```bash
npm install
npm run dev:server
npm run dev:console
npm test
npm run typecheck
```

## Pull Request Guidelines

- Keep each PR scoped to one clear objective.
- Add or update tests for behavior changes.
- Preserve API response shape consistency:
  - Success: `{ data, meta? }`
  - Error: `{ error: { code, message, details? } }`
- Include a short test plan in your PR description.

## Commit Style

Use conventional style:

- `feat(scope): description`
- `fix(scope): description`
- `test(scope): description`
- `docs(scope): description`

Example:

`feat(trust): add high-risk confirmation path`

## Reporting Issues

When opening an issue, include:

- Current behavior
- Expected behavior
- Steps to reproduce
- Environment details (OS, Node version)
