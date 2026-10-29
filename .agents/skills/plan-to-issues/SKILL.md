---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Every issue carries what [What every issue carries](#what-every-issue-carries) says. Ask the
   human only about anything a plan needs beyond it.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md> --label "plan:<plan>"
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

## What every issue carries

The human approved this shape when reviewing the morning-digest split (2026-10-29). The reviewer
sorts issues by the first line and the label.

- Label `plan:<plan>`, with `<plan>` from the `plan:` field in `plan.md`'s frontmatter.
- Body, in this order:

  ```
  Source: plan.md § <n>

  <scope: what to change and where, with the plan's constraints and the ADRs that apply>

  Done when: <the plan's "Done when", word for word>
  Blocked by: <#n and what for, or —>
  Worker: <model · effort>
  ```

- `<n>` is the plan's own section label (`1`, `2a`). `Worker` follows AGENTS.md: the strongest
  model for logic, a cheaper one for views and tests.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
