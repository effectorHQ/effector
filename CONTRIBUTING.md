# Contributing to effector

Thank you for considering contributing to effector.

## Getting Started

```bash
git clone https://github.com/OpenClawHQ/effectorhq.git
cd effectorhq
npm install
npm test
```

This runs all workspace tests. Every test must pass before submitting a PR.

## Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for how packages relate to each other.
See [PACKAGE_STATUS.md](PACKAGE_STATUS.md) for which packages are public, internal, or experimental.

## Development Workflow

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run `npm test` from the root — all 257+ tests must pass
5. Submit a pull request

## What We Accept

- Bug fixes with a regression test
- New compile targets (via `registerTarget()` in core)
- New type catalog entries (with justification)
- Documentation improvements
- CLI UX improvements

## What We Do Not Accept Right Now

- New CLI commands beyond the current P0/P1 set
- Runtime or orchestration features
- Heavy dependencies in any package
- Changes to the EffectorDef IR without an RFC

## Code Standards

- Pure ESM (`"type": "module"` everywhere)
- Node.js >= 18
- Zero external dependencies in `@effectorhq/core`
- stdout for machine-readable output, stderr for human-readable status
- `--json` flag on every command that produces structured output

## Commit Messages

Use clear, imperative commit messages:

```
fix: compile target validation compared strings to objects
feat: add reverse-compile export to core
docs: update README quickstart section
```

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
