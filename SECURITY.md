# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately. Do not open a public issue.

Use GitHub's private reporting:
[**Report a vulnerability**](https://github.com/MagoStudio/MagoStudio/security/advisories/new).
Only the maintainers can see the report.

Please include:

- the version of Mago Studio (shown in the app menu, or the release tag);
- your operating system;
- the steps to reproduce, and what an attacker could achieve.

We aim to acknowledge a report within five working days and to keep you updated until
it is fixed. We credit reporters in the release notes unless you ask us not to.

## Supported versions

Only the [latest release](https://github.com/MagoStudio/MagoStudio/releases/latest)
receives security fixes.

## Scope

In scope:

- the Mago Studio desktop app and its installers;
- the boundary between the renderer and the main process (IPC, the `mago-media://`
  protocol, navigation rules);
- the setup wizard's downloads and their SHA-256 verification.

Out of scope, please report to their own projects:

- ComfyUI and third-party ComfyUI node packs;
- open-weight models and their hosting;
- the Mago Cloud web service, unless the issue is reachable through Mago Studio.
