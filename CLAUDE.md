# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Working rules

- **Code reviews go on GitHub, not in chat.** When asked to review a pull request, post the findings as inline review comments on the relevant lines of the PR (one comment per finding, plus a short review summary). Do not repeat the findings in the chat reply; only link the review there. Use a general PR comment only for findings that have no line in the diff.
- When fixing review findings, reply on each thread with what was changed (commit hash, how it was tested) and resolve it. If a finding is not fixed, say why on the thread.
- Never add GitHub users as collaborators to give Claude access. Access comes from the Claude GitHub App.

## Project

phpBB extension **Recent Topics NG** (`imcger/recenttopicsng`), fork "RecentTopicsNGPlus". The extension lives in `imcger/recenttopicsng/` and is installed into a board at `ext/imcger/recenttopicsng/`. The root `README.md` is a symlink with an absolute target and does not resolve; the real README is `imcger/recenttopicsng/README.md`.

- Requirements: phpBB 3.3.5 – 3.3.x, PHP 8.0 – 8.5.
- `core/rtng_functions.php`: builds the topic lists. Recent topics are shown in **sections** (title + forum filter, stored as JSON in `config_text` `rtng_sections`; ids come from the config counter `rtng_section_next_id` and are never reused).
- `controller/`: page controller (`app.php/rtng/separate|simple`), ACP controller, shared helpers (`controller_common`, also section storage).
- `event/`: core event listeners. `migrations/`: schema and config changes; add a new migration for any new config/column, never edit a released one.
- `styles/all/template/`: Twig templates. `rtng_body_topbottom.html` / `rtng_body_side.html` loop over `rtng_sections` with nested `topics`, `pagination` and `cc` loops. `recenttopicsng.js` does the pagination in the browser (client side for sections up to `CLIENT_PAGINATION_MAX_TOPICS`, otherwise loads the section from the server).
- `adm/style/`: ACP template and JS (section editor).
- `language/en`, `language/de`, `language/de_x_sie`: every new language key must be added to all three (`de` uses "du", `de_x_sie` uses "Sie").
- Document user-visible changes in `docs/CHANGELOG.md`, and PHP/template event changes in `docs/Events.md`.

## Conventions

- Follow `.editorconfig`: tabs (width 4) for PHP, JS, CSS, HTML, Twig and Markdown; spaces for JSON/YAML; LF line endings.
- phpBB coding style: braces on their own line in PHP, `$this->db->sql_build_query()` arrays for SQL, `request->variable()` for all input (multibyte `true` for text). Template vars are not auto-escaped; text from the request is already HTML-escaped.
- Keep the license header block at the top of every file.
- Match the surrounding code's comment density and naming.

## Testing

There is no local test suite; CI (`.github/workflows/tests.yml`) runs the phpBB extension test framework on pull requests to `master`.

To check a change manually:

1. Install phpBB 3.3 with SQLite (`php install/phpbbcli.php install config.yml`), copy (do not symlink) `imcger/` into `ext/`, then `php bin/phpbbcli.php extension:enable imcger/recenttopicsng`.
2. Run `php bin/phpbbcli.php cache:purge` after every change to templates or PHP.
3. Serve the board with `php -S localhost:8099` and check the index (top, bottom, side locations), `app.php/rtng/separate` and `app.php/rtng/simple`.
4. Use Playwright with Chromium for the JavaScript: page changes, back/forward, page jump box, and that no unexpected requests or JS errors occur.
5. Lint with `php -l` and `node --check`.
