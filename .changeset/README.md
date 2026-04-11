# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets).

To create a new changeset:

```bash
pnpm changeset
```

Pick the affected packages, the bump type (patch / minor / major), and write a short description.
Commit the generated `.md` file together with your changes.

On merge to `main`, CI will open a "Version Packages" PR that bumps versions and updates `CHANGELOG.md` files.
