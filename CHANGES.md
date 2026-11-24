# Changes

## 0.1.0 2026-11-20

First entry of this change log. Earlier versions are on npm and in the git history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was `>=3`).
  Seneca 3 users stay on `@seneca/telemetry-datadog@0.0.1`.
* Node.js 24 or later (`engines.node` `>=24`; there was no `engines`
  field).
* The peer dependency `dd-trace` is `>=6.0.0` (was `>=2.11.0`). The
  tests run with `dd-trace` 6.26.0, the version that installs on
  Node.js 24.
* The option `getTracer` is optional. Without it, the plugin uses the
  tracer that `dd-trace` exports, which does nothing until the
  application calls `init()`. Before, the plugin failed to load
  without `getTracer`.
* `jest` is a development dependency (it was a runtime dependency).
* Tests: the plugin is now tested. A fake tracer checks one span per
  action, the span name and `pattern` tag, nested and `prior` calls,
  errors and unknown patterns. A child process runs a real `dd-trace`
  tracer with its log exporter. Live export to a Datadog agent was not
  tested on Seneca 4.
* `package-lock.json` is no longer committed. `publishConfig` sets
  public access, and the package includes `CHANGES.md`.
