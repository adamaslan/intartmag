# Stale open-PR recommendations — intartmag

**Date:** 2026-08-31
**Author:** queue-drain sweep (`/bugmerge1`) after merging PR #113
**Repo:** `adamaslan/intartmag`
**Scope:** the two open PRs that could **not** be drained mechanically and need a
human product decision.

---

## Snapshot

| PR | Title | Author | Opened | Head ref | State | Recommendation |
|---|---|---|---|---|---|---|
| [#102](https://github.com/adamaslan/intartmag/pull/102) | Remove links from gallery headings | michele-schultz | 2026-01-04 | `https/github.com/adamaslan/intartmag/commit/5933801…` | `CONFLICTING` | **Close.** Cherry-pick the one idea into a fresh 1-file PR. |
| [#108](https://github.com/adamaslan/intartmag/pull/108) | linkcard-1a | michele-schultz | 2026-01-20 | `main` | `CONFLICTING` / malformed | **Close now.** Not salvageable; would revert 5 merged PRs. |

Neither is mergeable, and neither can be fixed by rebase — both need a decision,
not a patch. Details below.

---

## PR #102 — "Remove links from gallery headings"

### What it does

On a single file, strips the Instagram `<a href="https://instagram.com/…">`
wrappers out of the ten `<h3>` gallery headings, leaving plain text:

```html
- <h3>1. <a href="https://instagram.com/BeverlysNYC" target="_blank">BeverlysNYC</a></h3>
+ <h3>1. BeverlysNYC </h3>
```

That is the entire change — 10 headings, one file, no other edits.

### Why it can't merge

1. **The file it edits no longer exists.** The PR targets a repo-root file
   literally named `10 Instagrammable Galleries in Chinatown` (no extension).
   That file was **rewritten and renamed** to
   [`pages/10-Galleries-in-Chinatown.html`](../pages/10-Galleries-in-Chinatown.html)
   in later work (PR #110 / the `china-10b` line). The new file has a different
   DOCTYPE, a different `<head>`, and inline `<style>` instead of the shared
   stylesheet — it is not the same document with a new path, it is a fresh
   authoring pass. Git sees the PR's base file as deleted → `CONFLICTING`.
2. **The head ref is broken.** `headRefName` is
   `https/github.com/adamaslan/intartmag/commit/5933801cdea1…` — a URL got
   pasted where a branch name belonged when the PR was created. GitHub can't
   auto-update or cleanly rebase a ref like that.
3. **7 months stale**, no CI, no review approvals, empty PR body.

### Is the idea still worth keeping?

**Maybe.** Whether gallery names in that listicle should be plain text or link
out is a real editorial call:

- **Keep them plain** (what #102 wants): the Instagram handles in the old markup
  were low quality — e.g. `href="https://instagram.com/Hyacinth Gallery"` has a
  literal space and is a dead link. Several others are guesses.
- **Link them properly**: each gallery has a real website (addresses are already
  in the file); heading links to the galleries' own sites would be more useful
  than to Instagram.

Check the **current** file first — [`pages/10-Galleries-in-Chinatown.html`](../pages/10-Galleries-in-Chinatown.html)
may already have resolved this during its rewrite.

### Recommendation

1. **Close PR #102** with a comment: superseded by the file rewrite; the
   extensionless base file is gone.
2. If the plain-text-headings decision is still wanted, open a **new one-file
   PR** against `pages/10-Galleries-in-Chinatown.html` from a properly-named
   branch (`git checkout -b fix/chinatown-heading-links origin/main`). It's a
   5-minute edit — not worth trying to resurrect #102's ref.
3. Delete the stray remote branch after closing.

---

## PR #108 — "linkcard-1a"

### What it is

Three commits with these messages:

```
4b48738  linkcard-1a
949166f1  Delete git checkout -b linkcard-1a
c387832d  Delete git checkout main
```

The commit titles alone (`Delete git checkout main`, `Delete git checkout -b …`)
say what happened: **shell commands were run inside a commit workflow that
committed files named after the commands**, then commits to delete those files.
The PR's head ref is `main` — it is a PR **from `main` into `main`**.

### Why it can't merge — and why it's dangerous

Because the branch was cut from a **January `main`** (before PRs #109, #110,
#111, #112, #113 landed), its diff against **today's `main`** is no longer
"add a link card." It now shows as:

- **Deletes** `pages/art-fairs.html`, `pages/artists.html`,
  `pages/international.html` (−100 lines each) — the 5 category hub pages added
  in **PR #112**.
- **Reverts** `index.html` — undoing the category-style rebuild from **PR #113**
  (~1000 lines of churn).
- **Deletes** `images/magnus-maxine-flowers-king-s.png` (a 25 MB binary).
- Touches ~40 other files, mostly reverting the article interlinking from #113.

Merging #108 today would **roll the site back seven months.** It is not a
feature PR anymore; it's a time machine.

### Is anything in it worth keeping?

The **original intent** — a "link card" component on the homepage (there are
`<!-- INSERT Link Card … here -->` markers in `index.html` today) — may still be
desirable. But nothing in these three commits is recoverable as-is:

- The actual link-card change is buried under two "delete my mistake" commits.
- Even isolated, it was written against a `main` that no longer exists.
- The `git checkout …`-named files must never land.

### Recommendation

1. **Close PR #108 immediately.** Do not rebase, do not "fix" it — there is
   nothing here that survives contact with current `main`.
2. Comment: closed as unsalvageable — branched from a January `main`, diff now
   reverts PRs #112–#113 and deletes a 25 MB asset; the two `Delete git
   checkout …` commits indicate a broken commit workflow.
3. **Do not delete the `main` branch** when GitHub offers to (it will, because
   `headRefName` is `main`). Closing the PR is enough.
4. If the homepage link-card is still wanted, treat it as **new work**: build it
   fresh against the current category-style `index.html`, using the existing
   `<!-- INSERT Link Card … -->` markers as the insertion point.

---

## Suggested execution order

```bash
# from anywhere; uses gh
gh pr close 108 --repo adamaslan/intartmag \
  --comment "Closing as unsalvageable — branched from a January main; diff now reverts PRs #112–#113 and deletes a 25MB asset. Rebuild the link-card as new work against current index.html if still wanted."

gh pr close 102 --repo adamaslan/intartmag \
  --comment "Closing — superseded by the file rewrite. The extensionless base file was renamed to pages/10-Galleries-in-Chinatown.html with a fresh head/styles. Re-open the plain-text-headings change as a one-file PR against the current file if still wanted." \
  --delete-branch
```

After both are closed, the intartmag PR queue is empty and the next change can
branch cleanly off `origin/main`.

---

## Process note (for next time)

Both PRs share one root cause: **a branch left open for months while `main`
moved.** PR #108 in particular shows the failure mode from
`~/.claude/rules/no-conflicts1.md` — work that keeps aging against a moving
`main` doesn't just get *harder* to merge, it eventually inverts into a
destructive diff. The fix is structural: land or close a PR within days, and
cut every new branch from `origin/main`, not from a local branch.
