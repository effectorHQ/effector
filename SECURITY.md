# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in effector, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email: **security@effectorhq.dev**

Or use GitHub's private vulnerability reporting feature on this repository.

We will acknowledge receipt within 48 hours and provide an initial assessment within 7 days.

## Scope

effector is a build-time tool that validates, audits, and compiles agent skill manifests. It does not execute agent tools at runtime (except via the optional `serve` package).

Security-relevant areas:

- **Audit scanner** (`@effectorhq/audit`): Detects prompt injection, permission creep, and data exfiltration patterns in SKILL.md files
- **Permission model**: The `[effector.permissions]` manifest section declares what capabilities a skill requires
- **Serve**: The `@effectorhq/serve` package enforces permissions at runtime boundaries

## Supported Versions

| Version | Supported |
|---|---|
| 1.x | Yes |
| < 1.0 | No |
