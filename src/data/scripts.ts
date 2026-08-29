import type { AgentDef, AgentId, MemEntry, RoutePlan, Step } from "../types";

export const AGENT_ORDER: AgentId[] = ["moss", "rivet", "specs", "lumen", "cricket"];

export const AGENT_DEFS: Record<AgentId, AgentDef> = {
  moss: {
    id: "moss",
    name: "Moss",
    role: "Foreman · routes work, reports back",
    hue: "#f2b44c",
    initials: "MO",
    desk: { x: 17, y: 21 },
    blurb: "Takes your requests, breaks them into tickets, and only bothers you when a signature is needed.",
  },
  rivet: {
    id: "rivet",
    name: "Rivet",
    role: "Build agent · writes the code",
    hue: "#5ec8de",
    initials: "RI",
    desk: { x: 62, y: 19 },
    blurb: "Heads-down builder. Owns branches, types, and the occasional stubborn merge.",
  },
  specs: {
    id: "specs",
    name: "Specs",
    role: "Review agent · tests & nits",
    hue: "#7bd88f",
    initials: "SP",
    desk: { x: 83, y: 33 },
    blurb: "Runs the suite twice, trusts it once. Finds the flaky test everyone blames on CI.",
  },
  lumen: {
    id: "lumen",
    name: "Lumen",
    role: "Research agent · reads & writes docs",
    hue: "#f0796b",
    initials: "LU",
    desk: { x: 45, y: 68 },
    blurb: "Reads the RFCs so nobody else has to. Turns decisions into docs that survive.",
  },
  cricket: {
    id: "cricket",
    name: "Cricket",
    role: "Ops agent · ships & keeps lights on",
    hue: "#b9dc5c",
    initials: "CR",
    desk: { x: 15, y: 64 },
    blurb: "Guards prod like a porch light. Will absolutely ask before touching anything irreversible.",
  },
};

export const SPOTS: Record<string, { x: number; y: number }> = {
  coffee: { x: 82, y: 74 },
  center: { x: 50, y: 43 },
  war: { x: 30, y: 27 },
  window: { x: 64, y: 86 },
  deskMoss: AGENT_DEFS.moss.desk,
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/* ---------------------------------- memory ---------------------------------- */

export const SEED_MEMORY: Omit<MemEntry, "id" | "ts">[] = [
  { scope: "shared", kind: "preference", text: "Team ships with pnpm. Nobody says npm out loud.", by: "moss" },
  { scope: "shared", kind: "decision", text: "Deploys go out Tue/Thu. Friday deploys are a firing offense (lovingly).", by: "cricket" },
  { scope: "shared", kind: "fact", text: "The repo is acme-billing. Checkout lives in src/checkout, sessions in src/session.", by: "rivet" },
  { scope: "cricket", kind: "fact", text: "Prod canary is 5% traffic for 10 minutes before full promotion.", by: "cricket" },
  { scope: "specs", kind: "preference", text: "A test is only trusted after two green runs in a row.", by: "specs" },
  { scope: "moss", kind: "note", text: "The boss prefers short summaries: what shipped, what's left, what needs a signature.", by: "moss" },
];

/* ------------------------------- idle flavor ------------------------------- */

export const IDLE_BUBBLES: Record<AgentId, string[]> = {
  moss: [
    "Board's clean. Suspicious.",
    "Sketching tomorrow's plan on the war-room wall.",
    "If it needs a signature, it comes to me first.",
  ],
  rivet: [
    "Sharpening the branch strategy.",
    "That one TODO has been there since March. I see you.",
    "Sketching a diff in the air.",
  ],
  specs: [
    "Ran the suite for fun. It passed. Unsettling.",
    "Cataloguing flaky tests by their excuses.",
    "Coverage is a feeling, not a number.",
  ],
  lumen: [
    "Reading an RFC nobody asked me to. Yet.",
    "Turning a meeting note into something survivable.",
    "The docs folder and I have an understanding.",
  ],
  cricket: [
    "Watching dashboards like a nature documentary.",
    "The pager is quiet. Enjoying it while it lasts.",
    "Coffee. Then containers.",
  ],
};

/* ------------------------------- warm boot ------------------------------- */

export const WARM_LINES: Record<AgentId, { kind: "cmd" | "out" | "ok" | "sys" | "msg" | "mem" | "warn"; text: string }[]> = {
  moss: [
    { kind: "sys", text: "shift started · restored ledger from last session" },
    { kind: "out", text: "board: 2 tickets open, 0 blocked, coffee machine: on" },
    { kind: "ok", text: "floor is warm. waiting on the boss." },
  ],
  rivet: [
    { kind: "cmd", text: "git checkout -b refactor/session-store" },
    { kind: "out", text: "Switched to a new branch 'refactor/session-store'" },
    { kind: "cmd", text: "rg \"SessionStore\" src --stats" },
    { kind: "out", text: "14 matches · 6 files · src/session/store.ts is the offender" },
  ],
  specs: [
    { kind: "cmd", text: "pnpm test --run --repeat 5 checkout.spec.ts" },
    { kind: "out", text: "run 1..5: 4 passed, 1 timed out at 5003ms (suspicious)" },
    { kind: "warn", text: "flaky suspect: fake-timer drift in checkout.spec.ts:88" },
  ],
  lumen: [
    { kind: "cmd", text: "open rfc-042-session-tiers.md" },
    { kind: "out", text: "12 pages. skimming for the part that matters…" },
  ],
  cricket: [
    { kind: "cmd", text: "docker compose ps" },
    { kind: "ok", text: "9 services up · redis healthy · queue depth 0" },
    { kind: "sys", text: "nothing on fire. heading to the coffee machine." },
  ],
};

export function greeting(persisted: boolean, memCount: number): string {
  if (!persisted) {
    return "First shift together. I'm Moss — I run this floor. Tell me what needs doing and I'll route it to Rivet, Specs, Lumen, or Cricket. Anything that spends money, deletes data, or touches prod comes to you for a signature first.";
  }
  return `Back again. The ledger held ${memCount} memories overnight and the floor is warm — Rivet's mid-refactor and Specs is chasing a flaky test. What's on the board today?`;
}

/* ------------------------------ step builders ------------------------------ */

interface BuildOpts {
  contended: boolean;
  spend: boolean;
  del: boolean;
  major: boolean;
}

const lockLine = (who: string, file: string): Step => ({
  label: "wait for the floor to uncross",
  cmd: `flock .locks/${file.replace(/[^\w-]/g, "_")}`,
  outputs: [
    `${file} is locked by ${who}… standing off their diff`,
    "lock acquired — no stomping, no lost edits",
  ],
  duration: 1800,
});

export function buildSteps(agent: AgentId, title: string, opts: BuildOpts): Step[] {
  const t = title.toLowerCase();
  const steps: Step[] = [];

  if (agent === "rivet") {
    if (/refactor|clean|restructur/.test(t)) {
      steps.push(
        { label: "map the blast radius", cmd: "rg \"SessionStore\" src --stats", outputs: ["14 matches across 6 files", "store.ts, middleware.ts, checkout/handlers.ts hit hardest"], duration: 2400 },
        { label: "carve the module", cmd: "git checkout -b refactor/session-store", outputs: ["new branch from main @ 4f2a1c", "moving storage behind an interface…", "src/session/store.ts → src/session/redis-store.ts"], duration: 3600, message: { to: "specs", text: "Heads up — session store is moving. Watch checkout.spec." } },
        { label: "rewrite the hot path", outputs: ["swap in-memory map for redis hash", "TTLs now live in one place (finally)", "−180 lines, +1 file, 0 any-casts"], duration: 3800, memory: { kind: "decision", text: "Session store lives behind SessionBackend interface; redis is the only impl.", scope: "rivet" } },
        { label: "prove it", cmd: "pnpm test --run src/session", outputs: ["session/store.spec.ts · 22 passed", "checkout integration · 9 passed"], duration: 2600, message: { to: "moss", text: "Refactor green. Diff's up for Specs." } },
      );
    } else if (/fix|bug|broken|failing|crash/.test(t)) {
      steps.push(
        { label: "reproduce it", cmd: "pnpm dev & curl -s localhost:5173/checkout", outputs: ["repro'd in 3 requests — race on session hydrate", "it's the await ordering. it's always the await ordering"], duration: 3000 },
        { label: "write the red test first", cmd: "pnpm test --run checkout.spec.ts", outputs: ["added regression case: hydrate-during-redirect", "1 failed (as intended) ✓"], duration: 2600, message: { to: "specs", text: "Regression test pushed. Don't trust the old one." } },
        { label: "patch", outputs: ["hoist the session await above the redirect guard", "guard now sees a settled session", "re-ran the loop 10×: green every time"], duration: 3200, memory: { kind: "fact", text: "checkout hydration race fixed by hoisting await above redirect guard.", scope: "shared" } },
        { label: "verify", cmd: "pnpm test --run", outputs: ["214 passed · 0 failed · 42.1s"], duration: 2200, message: { to: "moss", text: "Fix verified. One file changed, one test added." } },
      );
    } else {
      steps.push(
        { label: "scaffold", cmd: "pnpm gen route webhooks/stripe", outputs: ["src/routes/webhooks/stripe.ts created", "types generated from openapi.json"], duration: 2800 },
        { label: "implement the handler", outputs: ["verify signature before trusting the payload", "idempotency keys on every mutation", "errors go to the dead-letter queue, not /dev/null"], duration: 4000, message: { to: "specs", text: "New endpoint up on my branch — tear into it." } },
        { label: "cover it", cmd: "pnpm test --run src/routes/webhooks", outputs: ["11 tests: happy path, bad sig, replay, timeout", "all green"], duration: 2800, memory: { kind: "decision", text: "Webhook handlers verify signature first and use idempotency keys.", scope: "rivet" } },
        { label: "hand off docs", outputs: ["drafting endpoint contract for Lumen", "example payload committed to /docs/api"], duration: 2000, message: { to: "lumen", text: "Contract's in docs/api — can you make it readable?" } },
      );
    }
    if (opts.spend) {
      steps.splice(2, 0, {
        label: "the part that costs money",
        outputs: ["integration needs live API credits to verify end-to-end"],
        duration: 1600,
        approval: { kind: "spend", title: "Buy 500 API credits for integration testing", detail: "Rivet wants to verify the integration against the live sandbox, which burns credits.", amount: 12 },
      });
    }
  }

  if (agent === "specs") {
    if (/flaky|triage|intermittent|why/.test(t)) {
      steps.push(
        { label: "loop it until it confesses", cmd: "pnpm test --run --repeat 10 checkout.spec.ts", outputs: ["runs 1–7 green · run 8 red at 5003ms · 9–10 green", "timeout, not assertion — classic timer drift"], duration: 3400 },
        { label: "bisect the cause", outputs: ["fake timers advance before the promise settles", "repro rate: 1-in-8 on CI boxes, 1-in-14 locally", "it's checkout.spec.ts:88 — the fake-timer advance"], duration: 3400, memory: { kind: "fact", text: "checkout.spec flake = fake-timer advance racing session hydrate. Line 88.", scope: "specs" } },
        { label: "prescribe", outputs: ["fix: await the hydrate promise before advancing timers", "patch sent to Rivet with the repro"], duration: 2200, message: { to: "rivet", text: "Flake root-caused. Patch + repro in your inbox — line 88." } },
        { label: "trust, then verify twice", cmd: "pnpm test --run --repeat 20", outputs: ["20/20 green. Trust restored."], duration: 2600, message: { to: "moss", text: "Flake is dead. Verified twice, per house rules." } },
      );
    } else if (/review|diff|pr/.test(t)) {
      steps.push(
        { label: "read the diff slowly", cmd: "git diff main --stat", outputs: ["4 files · +312 −180", "reading rivet's diff with actual attention…"], duration: 3000 },
        { label: "nit pass", outputs: ["2 nits: naming in store.ts, missing TTL constant", "1 real find: retry loop has no backoff ceiling", "left comments, approved with the ceiling fix requested"], duration: 3600, message: { to: "rivet", text: "Approved with one ask: cap the retry backoff. Two nits for flavor." } },
        { label: "re-run everything", cmd: "pnpm test --run && pnpm lint", outputs: ["suite green · lint clean after fixes"], duration: 2400, memory: { kind: "preference", text: "Retry loops must have a backoff ceiling — now a review checklist item.", scope: "specs" } },
      );
    } else {
      steps.push(
        { label: "find the gaps", cmd: "pnpm test --run --coverage", outputs: ["coverage: 81.4% lines · src/session at 63% (ouch)"], duration: 3000 },
        { label: "write what's missing", outputs: ["+9 tests around TTL expiry and eviction", "edge cases: clock skew, double-spend of a token"], duration: 3600 },
        { label: "green the board", cmd: "pnpm test --run", outputs: ["223 passed · session coverage now 88%"], duration: 2400, message: { to: "moss", text: "Coverage up 7 points. Board is green." } },
      );
    }
  }

  if (agent === "lumen") {
    if (/research|compare|eval|choose/.test(t)) {
      steps.push(
        { label: "gather sources", cmd: "curl -s docs/… && read 6 sources", outputs: ["3 vendors, 2 OSS options, 1 regrettable blog post", "taking notes nobody asked for (yet)"], duration: 3200 },
        { label: "build the table", outputs: ["criteria: cost, latency, self-host, exit cost", "two viable options emerge; one is a trap (pricing cliff)"], duration: 3400, memory: { kind: "decision", text: "Recommendation written up in docs/research with the pricing-cliff caveat.", scope: "shared" } },
        { label: "publish the call", outputs: ["recommendation + one-pager committed", "TL;DR up top, receipts at the bottom"], duration: 2200, message: { to: "moss", text: "One-pager's ready. Short version: the boring option wins." } },
      );
    } else if (/rfc|read|summar/.test(t)) {
      steps.push(
        { label: "digest", cmd: "cat rfc-042-session-tiers.md", outputs: ["12 pages → 5 bullets", "the interesting part is buried on page 9 (of course)"], duration: 3000 },
        { label: "annotate", outputs: ["flagged 2 contradictions with RFC-031", "drafted questions for the next sync"], duration: 2800, memory: { kind: "fact", text: "RFC-042 contradicts RFC-031 on tier expiry — questions drafted.", scope: "lumen" } },
        { label: "circulate", outputs: ["summary posted to the shared ledger"], duration: 1800, message: { to: "moss", text: "RFC digested. Two contradictions flagged, summary in the ledger." } },
      );
    } else {
      steps.push(
        { label: "outline", outputs: ["structure: why → quickstart → reference → gotchas", "stealing the shape of every good doc I've read"], duration: 2600 },
        { label: "draft", cmd: "write docs/api/webhooks.md", outputs: ["quickstart with a copy-paste curl", "every param tabled, every error code named", "gotchas section written from scar tissue"], duration: 4000, message: { to: "rivet", text: "Doc draft is up — sanity-check the example payloads?" } },
        { label: "ship it", outputs: ["docs build passes · links resolve", "published to the docs site"], duration: 2000, memory: { kind: "note", text: "Webhook docs live. Keep the curl example in sync with the handler.", scope: "lumen" } },
      );
    }
  }

  if (agent === "cricket") {
    if (/deploy|ship|prod|release/.test(t)) {
      steps.push(
        { label: "build the artifact", cmd: "docker build -t acme-billing:2.14.0 .", outputs: ["layer cache: 11/13 hit · image 212MB (−9MB, nice)", "sbom + provenance attached"], duration: 3000, move: "desk" },
        { label: "canary", cmd: "fly deploy --canary 5", outputs: ["5% of traffic on 2.14.0 · watching error rate", "p50: 84ms · p99: 310ms · errors: 0.00%"], duration: 3200, move: "war" },
        { label: "the signature moment", outputs: ["canary looks bored. that's what we want.", "full promotion needs a human signature — house rule"], duration: 1400, approval: { kind: "major", title: "Promote canary to 100% of prod", detail: "2.14.0 is healthy at 5% traffic. Cricket wants to open the gates to everyone. This is production, so Cricket always asks." } },
        { label: "promote & watch", cmd: "fly scale count=3 && fly deploy --strategy rolling", outputs: ["100% on 2.14.0 · rolling, zero-downtime", "watched 10 minutes: nothing moved that shouldn't"], duration: 3400, memory: { kind: "decision", text: "v2.14.0 shipped to prod via canary → rolling. Clean bill.", scope: "shared" } },
        { label: "log it", outputs: ["changelog entry written · channel notified"], duration: 1600, message: { to: "moss", text: "2.14.0 is fully out. Dashboards are boring. Perfect." } },
      );
    } else if (/incident|down|alert|outage|on-call/.test(t)) {
      steps.push(
        { label: "read the room", cmd: "tail -f /var/log/app | grep -i error", outputs: ["error spike 14:02–14:05 · all from worker-2", "queue depth climbing: 0 → 412"], duration: 2800, move: "desk" },
        { label: "bisect", outputs: ["worker-2 OOM-killed twice, then gave up", "cause: a 900MB PDF in the render queue (again)"], duration: 3200, memory: { kind: "fact", text: "Incident: worker-2 OOM on giant PDF. Render queue needs a size cap.", scope: "shared" } },
        { label: "the irreversible bit", outputs: ["cleanest fix is purging the poisoned jobs", "that deletes 37 queued jobs — signature required"], duration: 1400, approval: { kind: "delete", title: "Purge 37 poisoned jobs from the render queue", detail: "The jobs reference a corrupt 900MB asset and will keep OOM-ing workers. Purging drops them permanently; senders get a retry notice." } },
        { label: "stabilize", cmd: "docker compose up -d --scale worker=3", outputs: ["queue draining: 412 → 0 in 90s", "added a 200MB size cap until the real fix lands"], duration: 3000, message: { to: "moss", text: "Fire out. Queue drained, size cap on. Postmortem doc requested from Lumen." } },
      );
    } else {
      steps.push(
        { label: "inspect the rig", cmd: "docker compose ps && df -h", outputs: ["9 services up · disk at 61% (fine)", "redis replication lag: 0ms"], duration: 2600 },
        { label: "tune", outputs: ["bumped worker memory 512→768MB after the PDF incident", "healthcheck intervals 30s→15s on the flaky one"], duration: 3000 },
        { label: "the spending bit", outputs: ["traffic's creeping up; pool wants to grow 2→4", "that's real money, so: signature time"], duration: 1400, approval: { kind: "spend", title: "Scale worker pool from 2 to 4 instances", detail: "Cricket wants headroom before the traffic bump hits. Costs about $24/month extra.", amount: 24 } },
        { label: "apply & verify", cmd: "docker compose up -d --scale worker=4", outputs: ["4 workers healthy · p99 down 18%", "dashboard annotated so future-me knows why"], duration: 2600, message: { to: "moss", text: "Pool scaled, latency down. Invoice will be $24 kinder than an outage." } },
      );
    }
    if (opts.del && !steps.some((s) => s.approval?.kind === "delete")) {
      steps.push({ label: "take out the trash", outputs: ["found 2,143 stale session rows older than 30d", "deleting data is signature-or-it-didn't-happen"], duration: 1400, approval: { kind: "delete", title: "Delete 2,143 stale session rows", detail: "Rows older than the 30-day retention window. Gone means gone — no soft-delete on this table." } });
    }
  }

  if (agent === "moss") {
    steps.push(
      { label: "coordinate", outputs: ["checking the board, the ledger, and who's holding locks"], duration: 2000, move: "war" },
      { label: "sync the floor", outputs: ["pings sent, blockers surfaced", "summary for the boss drafted"], duration: 2200 },
    );
  }

  if (opts.contended && steps.length > 1) steps.splice(1, 0, lockLine(pick(AGENT_ORDER.filter((a) => a !== agent)), "src/checkout"));
  if (opts.major && agent !== "cricket" && !steps.some((s) => s.approval?.kind === "major")) {
    steps.splice(Math.max(1, steps.length - 1), 0, {
      label: "the big one",
      outputs: ["this rewrites shared code — signature required before I swing"],
      duration: 1400,
      approval: { kind: "major", title: `Approve major change: ${title}`, detail: "Touches shared code paths. House rule: big swings get a human nod first." },
    });
  }

  return steps;
}

/* ------------------------------- user routing ------------------------------- */

export function detectFlags(text: string) {
  const t = text.toLowerCase();
  return {
    spend: /buy|paid|credit|cost|subscri|\$|invoice/.test(t),
    del: /delete|remove|drop|prune|purge|clean/.test(t),
    major: /migrat|rewrite|big change|major|redesign/.test(t),
  };
}

export function fallbackPlan(text: string): RoutePlan {
  const t = text.toLowerCase();
  const flags = detectFlags(text);
  const tasks: RoutePlan["tasks"] = [];

  if (/(deploy|ship|prod|release|docker|ci\b|infra|scale|incident|down|outage|alert)/.test(t))
    tasks.push({ agent: "cricket", title: text.length > 64 ? text.slice(0, 61) + "…" : text });
  if (/(flaky|review|test|bug|fix|broken|failing|crash|triage)/.test(t))
    tasks.push({ agent: /flaky|triage|failing/.test(t) ? "specs" : "rivet", title: text.length > 64 ? text.slice(0, 61) + "…" : text });
  if (/(doc|research|compare|rfc|read|summar|explain|write up)/.test(t))
    tasks.push({ agent: "lumen", title: text.length > 64 ? text.slice(0, 61) + "…" : text });
  if (tasks.length === 0 || /(build|feature|implement|add|api|component|refactor|webhook|endpoint)/.test(t))
    tasks.push({ agent: "rivet", title: text.length > 64 ? text.slice(0, 61) + "…" : text });

  // dedupe agents, keep first two
  const seen = new Set<AgentId>();
  const dedup = tasks.filter((x) => (seen.has(x.agent) ? false : (seen.add(x.agent), true))).slice(0, 2);

  const needsSig = flags.spend || flags.del || flags.major || /(deploy|ship|prod|release)/.test(t);
  const reply = dedup.length === 1
    ? `On it — ${AGENT_DEFS[dedup[0].agent].name} takes it from here. I'll stay quiet unless a signature's needed.`
    : `Splitting it up: ${dedup.map((d) => `${AGENT_DEFS[d.agent].name} on ${d.agent === "cricket" ? "ops" : d.agent === "specs" ? "verification" : d.agent === "lumen" ? "docs/research" : "the build"}`).join(", ")}. They'll coordinate on the floor — you'll only hear from me at the end${needsSig ? ", or sooner if someone needs a signature" : ""}.`;

  return { reply, tasks: dedup };
}

export const MOSS_ACKS = [
  "Copy that. Ticket's on the board.",
  "Got it. Routing now — watch the floor.",
  "Understood. I'll keep the summary short when it lands.",
];

export function randomIdleBubble(agent: AgentId): string {
  return pick(IDLE_BUBBLES[agent]);
}
