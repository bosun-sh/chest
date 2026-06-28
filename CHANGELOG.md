# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Public npm-facing package metadata and subpath exports for the CLI and MCP entrypoints.
- A packed-artifact smoke test in CI.
- A consumer-facing README with install and launcher examples.

### Changed

- Validation reports are now written to `.chest/reports/*.yaml` while the readers remain compatible with legacy `.json` files.

## [0.0.1] - 2026-05-25

### Added

- Initial Chest registry, CLI, and MCP tool surface.
- YAML-backed governance storage for OKRs, KPIs, DoR, DoD, validation reports, and judge workflows.

[Unreleased]: https://github.com/bosun-sh/chest/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/bosun-sh/chest/releases/tag/v0.0.1
