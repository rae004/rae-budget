# Changelog

## [0.1.5](https://github.com/rae004/rae-budget/compare/v0.1.4...v0.1.5) (2026-04-26)


### Features

* add monthly_target to categories ([44ca6c0](https://github.com/rae004/rae-budget/commit/44ca6c0eff6999373e50ea96dba3ecf4e90d4f99))
* add monthly_target to categories ([d09c013](https://github.com/rae004/rae-budget/commit/d09c0135fe6fbb1fe944a8952252597f444fb287))

## [0.1.4](https://github.com/rae004/rae-budget/compare/v0.1.3...v0.1.4) (2026-04-26)


### Features

* replace SQL init with Alembic schema migrations ([1dd8895](https://github.com/rae004/rae-budget/commit/1dd88952f5886d2b1b0dbf8c2bc3ed1baad4467d))
* replace SQL init with Alembic schema migrations ([c536379](https://github.com/rae004/rae-budget/commit/c536379e4518f260a6755f1a75f0f067f4543343))

## [0.1.3](https://github.com/rae004/rae-budget/compare/v0.1.2...v0.1.3) (2026-04-26)


### Features

* codecov + comprehensive backend/frontend test coverage ([4d06011](https://github.com/rae004/rae-budget/commit/4d060119571c346c1f011b6ff71911ec89f67496))


### Bug Fixes

* return 400 instead of 500 for Pydantic validation errors ([485fe74](https://github.com/rae004/rae-budget/commit/485fe7444f1fe6433c0dcbf7614bc4154deb57bb))

## [0.1.2](https://github.com/rae004/rae-budget/compare/v0.1.1...v0.1.2) (2026-04-26)


### Bug Fixes

* isolate backend venv from host bind mount ([be1d86f](https://github.com/rae004/rae-budget/commit/be1d86f595ef505ece7183f352433d1a98b93914))
* isolate backend venv from host bind mount ([e36e18d](https://github.com/rae004/rae-budget/commit/e36e18d87cd61800ec2bd2f27c220daa1984689b))

## [0.1.1](https://github.com/rae004/rae-budget/compare/v0.1.0...v0.1.1) (2026-04-26)


### Features

* add additional income field to pay periods ([3c52331](https://github.com/rae004/rae-budget/commit/3c523319e06504f28efba8a9a14c8654d5f79d6b))
* add additional income field to pay periods ([34b5272](https://github.com/rae004/rae-budget/commit/34b5272c0cc68c8d486f75f295c0fa2c02e6ce58))
* add category management with safe-delete confirmation ([f452977](https://github.com/rae004/rae-budget/commit/f452977d7d128a3d576c13d44c5ecbb161116bde))
* add data export/import/reset functionality to Settings ([316824e](https://github.com/rae004/rae-budget/commit/316824eda4d628e63aeb9a5f226072199f5cd90f))
* add description field to additional income ([925a7cd](https://github.com/rae004/rae-budget/commit/925a7cd49d75dc553021438d7ce2b5f592f8e6a7))
* add inline editing and frontend tests ([df28cc1](https://github.com/rae004/rae-budget/commit/df28cc16e1f94225648f8f40814df514f550d85c))
* add Phase 4 integration and polish improvements ([f998799](https://github.com/rae004/rae-budget/commit/f998799c5fda10f3064ee8102f3c4e238d99203f))
* category management UI and project polish ([0f17347](https://github.com/rae004/rae-budget/commit/0f17347bb35beefefab98902bfa89251006e1ca7))
* implement frontend with React Router and TanStack Query (phase 3) ([8e5aec2](https://github.com/rae004/rae-budget/commit/8e5aec25fc3b532d9f8064e7b4fb241c2f231c02))
* implement frontend with React Router and TanStack Query (phase 3) ([cc0438d](https://github.com/rae004/rae-budget/commit/cc0438d2e95535328c5655ae9e3d80ab98ad254b))
* implement project foundation and backend API (phases 1-2) ([b330694](https://github.com/rae004/rae-budget/commit/b330694bcbfa1ed6f63fb8588fad2365aa1e8c55))
* Phase 4 enhancements - additional income, data management, and UX improvements ([f38217c](https://github.com/rae004/rae-budget/commit/f38217c237625b6a4f91f30044fc21c47d4ce884))


### Bug Fixes

* add new pay period table column to sql init script. ([d6f1340](https://github.com/rae004/rae-budget/commit/d6f13402765890f59f315e4241f97cffea45dd54))
* auto-assign bills by due date within pay periods ([d0bb4bb](https://github.com/rae004/rae-budget/commit/d0bb4bb55383356d40199f3b0396f0338e468a60))
* correct date display with timezone-aware parsing ([b1ca581](https://github.com/rae004/rae-budget/commit/b1ca5814010836bcee9660dbe10542a63c5189b5))
* resolve deprecation warnings and lint issues in backend ([3979592](https://github.com/rae004/rae-budget/commit/3979592ffe58b1e1458cd2581f5493f38f880ebe))

## Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Releases are managed automatically by [release-please](https://github.com/googleapis/release-please) based on [Conventional Commits](https://www.conventionalcommits.org/).
