# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [Unreleased](https://github.com/dotenv-org/dotenv-vault-core/compare/v0.6.1...master)

## [0.7.0](https://github.com/dotenv-org/dotenv-vault-core/compare/v0.6.1...v0.7.0) (2023-01-27)

### Added

- Expose `decrypt` method ([#8](https://github.com/dotenv-org/dotenv-vault-core/pull/8))
- Smart path lookup when .vault appended ([#6](https://github.com/dotenv-org/dotenv-vault-core/pull/6))

## [0.6.1](https://github.com/dotenv-org/dotenv-vault-core/compare/v0.6.0...v0.6.1) (2022-10-28)

### Changed

- Patch return bug - returning too early 🐞

## [0.6.0](https://github.com/dotenv-org/dotenv-vault-core/compare/v0.5.0...v0.6.0) (2022-10-27)

### Added

- Added comma separated capability to `DOTENV_KEY`. Add multiple keys to your DOTENV_KEY for use with decryption. Separate with a comma. [#4](https://github.com/dotenv-org/dotenv-vault-core/pull/4)

### Removed

- Removed `DOTENV_KEY2` [#4](https://github.com/dotenv-org/dotenv-vault-core/pull/4)

## [0.5.0](https://github.com/dotenv-org/dotenv-vault-core/compare/v0.4.0...v0.5.0) (2022-10-24)

### Added

- Added support for `DOTENV_KEY2`. Allow for rotating decryption keys without downtime. [#3](https://github.com/dotenv-org/dotenv-vault-core/pull/3)

## [0.4.0](https://github.com/dotenv-org/dotenv-vault-core/compare/v0.3.0...v0.4.0) (2022-10-23)

### Changed

- Warn rather than raise error when .env.vault file is missing [#2](https://github.com/dotenv-org/dotenv-vault-core/pull/2)

## 0.3.0 and prior

Please see commit history.


