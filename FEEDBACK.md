# KeeperHub Integration Feedback

This file is being kept during the AgentCred build for the ETHGlobal Open Agents hackathon.

AgentCred uses KeeperHub execution data as the reputation source for AI agents. The app stores a KeeperHub project ID during registration, receives execution events through a webhook, pulls full execution history from the KeeperHub API, recomputes a score, caches the result in SQLite, and mirrors score fields into ENS text records.

## What Was Easy

- The project model maps cleanly to AgentCred. A KeeperHub project ID gives us a stable identifier to connect execution history to an ENS agent profile.
- The webhook flow is a good fit for reputation updates. AgentCred can react to an execution event and update the public ENS profile without requiring the operator to manually refresh state.
- Using KeeperHub as the source of execution data makes the demo much stronger than a self-reported score. The reputation model depends on external execution outcomes rather than user-entered claims.

## What Was Confusing

- The exact execution response shape needs clearer examples. AgentCred currently normalizes several possible fields such as `txHash`, `transactionHash`, `timestamp`, `createdAt`, `status`, and `gasUsed` because the expected canonical payload was not obvious while scaffolding.
- Webhook signature verification needs a precise specification in one place. The implementation currently assumes an HMAC SHA-256 signature using the raw request body and accepts either `sha256=<hex>` or raw hex. If KeeperHub uses a timestamped payload, a different header name, or a different signing base string, this will need adjustment.
- The best way to identify the relevant agent from a webhook event should be documented explicitly. AgentCred currently looks for `projectId` or `keeperhubId` at the top level and under `data`.

## Docs Gaps

- A complete webhook payload example for a successful execution, failed execution, and pending execution would reduce integration guesswork.
- A table of execution status values would help builders avoid brittle normalization. For example, whether the API returns `success`, `completed`, `succeeded`, `failed`, `error`, or another value.
- The executions endpoint should document pagination, ordering, maximum `limit`, and whether results are sorted newest-first by default.
- It would be useful to document the recommended flow for hackathon demos: create project, configure webhook, trigger execution, inspect execution event, fetch execution history.

## DX Friction

- Local webhook testing requires a public tunnel or deployed preview URL. That is normal, but a KeeperHub CLI or test webhook sender would make iteration faster.
- Without a known sample payload, backend code needs to be defensive and accept multiple possible field names. This slows down the first integration pass.
- If webhook delivery logs exist in the dashboard, they are important for debugging and should be easy to find from the project settings page.

## Feature Requests

- Add a "Send test webhook" button for a project, with configurable event type.
- Add typed OpenAPI examples or TypeScript types for projects, executions, analytics, and webhook events.
- Include webhook signing examples in JavaScript/TypeScript, with raw body handling for common frameworks like Next.js App Router.
- Expose a stable execution explorer URL that can be linked from apps like AgentCred.
- Consider adding an agent-facing metadata field on projects so apps can store an ENS name or external profile URL directly in KeeperHub.

## Bugs Or Open Questions

- Not yet verified against live KeeperHub webhook delivery. The current implementation is ready for raw-body HMAC verification, but the exact signature format must be tested with a real project.
- Not yet verified whether `/projects/{projectId}/executions?limit=...` is the final production endpoint shape. AgentCred will update the client if the canonical route differs.
- Not yet verified whether gas usage and transaction hash are always present for the execution types AgentCred will demo.

## Current AgentCred Implementation Notes

- KeeperHub client: `src/lib/keeperhub.ts`
- Webhook listener: `src/app/api/webhook/keeperhub/route.ts`
- Manual signed sync: `src/app/api/sync/route.ts`
- Reputation recompute and ENS mirror: `src/lib/syncFromKeeperHub.ts`
- Operator dashboard webhook setup UI: `src/app/dashboard/page.tsx`

