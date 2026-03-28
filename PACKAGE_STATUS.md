# Package Status

| Package | npm Name | Status | Published | Stability |
|---|---|---|---|---|
| `cli/` | `@effectorhq/cli` | **Public** | Yes | Stable (v1.0.0) |
| `packages/core/` | `@effectorhq/core` | **Public** | Yes | Stable (v1.0.0) |
| `packages/serve/` | `@effectorhq/serve` | **Public** | Yes | Experimental (v0.1.0) |
| `packages/types/` | `@effectorhq/types` | Internal | No | Stable |
| `packages/audit/` | `@effectorhq/audit` | Internal | No | Stable |
| `packages/compose/` | `@effectorhq/compose` | Internal | No | Research |
| `packages/lint/` | `@effectorhq/lint` | Internal | No | Stable |

## What "Internal" Means

Internal packages are used by the CLI and serve packages. They are not published to npm separately. Their APIs may change without notice. Do not depend on them directly.

## What "Research" Means

The compose package contains a working type-checked composition engine, but it has no CLI surface and its API is not finalized. It exists for internal use and future development.

## What "Experimental" Means

The serve package works but is not the primary product. Its API and behavior may change between minor versions. Use it for development and testing.
