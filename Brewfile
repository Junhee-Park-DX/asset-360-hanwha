# System-level (Homebrew) tools this project actually needs.
# Do not add packages here just because they're installed on a given
# machine — only genuine project requirements. See CLAUDE.md §10.

# Generates a locally-trusted TLS certificate so the Vite dev server can run
# over HTTPS — required by `mkcertPlugin()` in vite.config.ts, because the
# Fusion host page is HTTPS and won't load an HTTP-served dev app in an
# iframe. Installed via the `setup-flows-auth` skill.
brew "mkcert"

# Provides `pdftoppm`, used by Claude Code's Read tool to render PDF pages as
# images. Needed to read `info/Flows Builder Certification — Guided
# Hands-On Build.pdf`, which is checked into this repo.
brew "poppler"
