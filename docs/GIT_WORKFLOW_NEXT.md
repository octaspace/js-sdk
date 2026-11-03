# Working with the `next` branch

`next` is the branch that moves the SDK to the new OctaSpace API (test stand
`https://api-dev.octa.space`). All changes for the new API go into `next` through pull requests;
`next` is merged into `main` by a separate decision, once the new API is in production. `main`
remains the branch of the current (legacy) SDK and its hotfixes. Cube, go-sdk and octa-cli work
the same way.

The default branch on GitHub is **`main`**, so a pull request opened without an explicit base
goes to `main`, not to `next`.

## `main` and `next`, step by step

| Step | Working with `main` | Working with `next` |
|---|---|---|
| Update branches | `git fetch origin` | `git fetch origin` — the same |
| Switch to the base branch | `git switch main` | `git switch next` |
| Pull the latest code | `git pull` | `git pull` — the same (`next` tracks `origin/next`) |
| New task branch | `git switch -c feat/x` (from `main`) | `git switch -c feat/x origin/next` ← **the main difference** |
| Commit | `git add …` → `git commit` | the same |
| First push of the branch | `git push -u origin feat/x` | the same (push the task branch, not `next`) |
| Pull the latest base | `git rebase origin/main` | `git rebase origin/next` |
| Pull request with `gh` | `gh pr create` | `gh pr create --base next` ← **required** |
| Pull request on the website | base `main` is preselected | change **base: main → next** by hand |
| Diff of the branch against its base | `git diff main...HEAD` | `git diff origin/next...HEAD` |
| After the pull request is merged | `git switch main && git pull` | `git switch next && git pull` |

`git switch -c feat/x origin/next` creates the task branch straight from the remote `next`, even
when you are on `main` and have no local `next`. The branch tracks `origin/next` at first; the
first `git push -u origin feat/x` switches it to its own remote branch.

## A typical task

```bash
git fetch origin
git switch -c feat/my-task origin/next   # from the latest next, even if you are on main
# ... changes ...
pnpm check                               # build + typecheck + lint + test
pnpm changeset                           # if published behaviour changes
git add -A && git commit -m "…"
git push -u origin feat/my-task
gh pr create --base next                 # without --base the pull request goes to main
```

If something was merged into `next` while you worked, update the branch before the pull request:

```bash
git fetch origin
git rebase origin/next
git push --force-with-lease              # a plain push is refused after a rebase
```

## Dependent pull requests (a stack)

If task B builds on task A that is not merged yet, create branch B from A and open its pull
request with base A: `gh pr create --base feat/a`. The pull request then shows only B's changes.

⚠️ **Do not delete branch A on merge** (`gh pr merge --delete-branch` or the "Delete branch"
button) while pull request B still targets it: GitHub **closes** pull request B instead of
retargeting it. Merge the stack one pull request at a time, in this order:

```bash
gh pr merge <A> --merge                 # without --delete-branch
gh pr edit <B> --base next              # retarget the next pull request
git push origin --delete feat/a         # now branch A can be deleted
```

If pull request B got closed anyway: restore branch A at its last commit
(`git push origin <sha>:refs/heads/feat/a`), then `gh pr reopen <B>` and
`gh pr edit <B> --base next`.

## Easy mistakes

1. **The pull request went to `main`.** `--base next` was forgotten or the base was not changed on
   the website: the pull request shows the whole difference between `next` and `main`.
   Fix: `gh pr edit <N> --base next`.
2. **The branch was created from `main`.** `git switch -c feat/x` while on `main` branches off
   `main`, and a pull request into `next` brings extra commits along. Always name the base
   explicitly (`origin/next`) instead of relying on the current branch.
   Fix: `git rebase --onto origin/next origin/main feat/x`.
3. **A direct push to `next`.** Push only task branches; changes reach `next` only through pull
   requests, as with `main`.
4. **Hotfixes in `main` do not reach `next`.** Urgent fixes of the legacy SDK still go through a
   branch from `main` and a pull request into `main`. So that they are not lost, `main` is merged
   into `next` from time to time by a separate pull request:

   ```bash
   git switch -c chore/sync-main-into-next origin/next
   git merge origin/main
   git push -u origin chore/sync-main-into-next
   gh pr create --base next
   ```

5. **A stale local `next`.** It only updates on `git pull`. For a new branch or a rebase, use
   `origin/next` right after `git fetch`.

## CI and releases

- CI (`.github/workflows/ci.yml`) runs on pushes to `main` and `next` and on every pull request,
  including stacked ones.
- Dependabot opens update pull requests against `next` (`target-branch` in
  `.github/dependabot.yml`). Switch `target-branch` back to `main` once `next` is merged.
- Nothing from `next` is published to npm until the new API is in production.

## If `next` lives long

The default branch on GitHub (Settings → Branches) can be switched to `next`: pull requests then
target it automatically and mistake 1 goes away. This changes the default base for the whole
team, so it is a team decision, not an individual one.
