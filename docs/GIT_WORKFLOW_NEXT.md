# Работа с веткой `next`

`next` — ветка перехода SDK на новое API OctaSpace (стенд `https://api-dev.octa.space`).
Все правки под новое API идут PR-ами в `next`; слияние `next → main` — отдельным решением,
когда новое API выйдет в прод. `main` остаётся веткой текущего (legacy) SDK и хотфиксов.
Так же устроены Cube, go-sdk и octa-cli.

На GitHub ветка по умолчанию — **`main`**. Поэтому PR, открытый без явной базы,
уходит в `main`, а не в `next`.

## `main` и `next` — по шагам

| Шаг | Работа с `main` | Работа с `next` |
|---|---|---|
| Обновить ветки | `git fetch origin` | `git fetch origin` — то же |
| Перейти на базовую ветку | `git switch main` | `git switch next` |
| Подтянуть свежий код | `git pull` | `git pull` — то же (`next` отслеживает `origin/next`) |
| Новая ветка задачи | `git switch -c feat/x` (с `main`) | `git switch -c feat/x origin/next` ← **главное отличие** |
| Коммит | `git add …` → `git commit` | то же |
| Первый пуш ветки | `git push -u origin feat/x` | то же (пушится ветка задачи, не `next`) |
| Подтянуть свежую базу | `git rebase origin/main` | `git rebase origin/next` |
| PR через `gh` | `gh pr create` | `gh pr create --base next` ← **обязательно** |
| PR на сайте | база `main` подставится сама | вручную сменить **base: main → next** |
| Диф ветки против базы | `git diff main...HEAD` | `git diff origin/next...HEAD` |
| После слияния PR | `git switch main && git pull` | `git switch next && git pull` |

`git switch -c feat/x origin/next` создаёт ветку задачи прямо от удалённой `next`,
даже если сейчас вы стоите на `main` и локальной `next` у вас нет. Ветка сразу
отслеживает `origin/next`; первый `git push -u origin feat/x` переключает её на
собственную удалённую ветку.

## Типовой цикл задачи

```bash
git fetch origin
git switch -c feat/my-task origin/next   # от свежей next, даже если сейчас стоите на main
# ... правки ...
pnpm check                               # build + typecheck + lint + test
pnpm changeset                           # если меняется опубликованное поведение
git add -A && git commit -m "…"
git push -u origin feat/my-task
gh pr create --base next                 # без --base PR откроется в main
```

Если пока вы работали, в `next` что-то влили — обновить ветку перед PR:

```bash
git fetch origin
git rebase origin/next
git push --force-with-lease              # после rebase обычный push откажет
```

## Зависимые PR (стек)

Если задача B строится на ещё не влитой задаче A, ветку B создают от A, а PR открывают
с базой A: `gh pr create --base feat/a`. Тогда в PR видна только разница B. После
слияния A (с удалением её ветки) GitHub сам перенацелит PR B на `next`. Если ветку A
не удалили, перенацелить вручную: `gh pr edit <N> --base next`, затем
`git rebase --onto origin/next feat/a feat/b` и `git push --force-with-lease`.

## Ошибки, которые легко сделать

1. **PR открылся в `main`.** Забыли `--base next` или не сменили base на сайте —
   в PR вся разница `next` против `main`.
   Исправить: `gh pr edit <N> --base next`.
2. **Ветка создана от `main`.** `git switch -c feat/x`, стоя на `main`, даёт ветку
   от `main`, и PR в `next` притащит лишние коммиты. Поэтому базу всегда указывать
   явно (`origin/next`), а не полагаться на текущую ветку.
   Исправить: `git rebase --onto origin/next origin/main feat/x`.
3. **Прямой push в `next`.** Пушить только ветки задач; в `next` — только через PR,
   как и в `main`.
4. **Хотфиксы в `main` не доходят до `next`.** Срочные исправления legacy-SDK идут
   веткой от `main` с PR в `main`. Чтобы они не потерялись, `main` периодически
   вливается в `next` отдельным PR:

   ```bash
   git switch -c chore/sync-main-into-next origin/next
   git merge origin/main
   git push -u origin chore/sync-main-into-next
   gh pr create --base next
   ```

5. **Устаревшая локальная `next`.** Она обновляется только по `git pull`. Для новой
   ветки и rebase надёжнее брать `origin/next` сразу после `git fetch`.

## CI и релизы

- CI (`.github/workflows/ci.yml`) запускается на push и PR в `main` и `next`.
- Dependabot открывает PR обновлений в `next` (`target-branch` в `.github/dependabot.yml`).
  После слияния `next → main` вернуть `target-branch: main`.
- Пакеты из `next` в npm не публикуются, пока новое API не выйдет в прод.

## Если `next` — надолго

Можно переключить ветку по умолчанию на GitHub (Settings → Branches) на `next`:
PR будут открываться в неё сами, и ошибка 1 исчезнет. Это меняет базу по умолчанию
для всей команды, поэтому решается командой, а не одним разработчиком.
