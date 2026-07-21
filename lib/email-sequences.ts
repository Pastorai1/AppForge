import type { EmailSequenceType } from "@/lib/types";

/**
 * Definitions of each one-to-many email sequence: the ordered "beats" that make
 * up the sequence. The Emails tool generates one email per step (fast-batch, to
 * stay under Vercel's function timeout), grounded in the Brain + chosen voice.
 */

export interface EmailStep {
  purpose: string; // short label shown in the UI
  instruction: string; // what this specific email should do
}

export interface EmailSequenceSpec {
  type: EmailSequenceType;
  label: string;
  description: string;
  steps: EmailStep[];
}

export const EMAIL_SEQUENCE_SPECS: EmailSequenceSpec[] = [
  {
    type: "welcome",
    label: "Welcome / onboarding",
    description:
      "The first emails a new subscriber or trial user receives. Builds trust and drives the first meaningful action.",
    steps: [
      {
        purpose: "Warm welcome",
        instruction:
          "Warmly welcome the new subscriber/trial user. Confirm they're in the right place, set expectations for what's coming, and deliver a quick reassurance. End with one simple next step.",
      },
      {
        purpose: "First quick win",
        instruction:
          "Give one concrete quick win they can get right now — a tip, a feature, or a small action that delivers value fast and proves the product is worth their time.",
      },
      {
        purpose: "Why we exist",
        instruction:
          "Tell the short origin/why story behind the product in the character's voice. Build connection and trust; make the reader feel understood.",
      },
      {
        purpose: "Soft call to action",
        instruction:
          "Invite them to take the core action or start/continue their trial. Keep it low-pressure and benefit-led; make the value obvious and the step easy.",
      },
    ],
  },
  {
    type: "soap_opera",
    label: "Soap Opera (5-email story)",
    description:
      "A 5-email story arc (Russell Brunson's Soap Opera Sequence) that builds connection through drama and epiphany, then leads to the offer.",
    steps: [
      {
        purpose: "Set the stage",
        instruction:
          "Set the stage. Introduce the character and hint that a story/change is coming. Create an open loop that makes the reader want the next email.",
      },
      {
        purpose: "High drama & backstory",
        instruction:
          "Share the high-drama backstory — the wall they hit, the struggle, the low point. Be honest and relatable; keep the tension building.",
      },
      {
        purpose: "The epiphany",
        instruction:
          "Reveal the epiphany — the realization or discovery that changed everything and led to the solution. Connect it to what the reader is struggling with.",
      },
      {
        purpose: "Hidden benefits",
        instruction:
          "Reveal the hidden benefits — the deeper, often-overlooked advantages of the solution. Handle unspoken objections along the way.",
      },
      {
        purpose: "Urgency & offer",
        instruction:
          "Make the clear offer with a reason to act now (urgency or scarcity that's honest). Recap the transformation and give a direct call to action.",
      },
    ],
  },
  {
    type: "seinfeld",
    label: "Seinfeld (daily value + offer)",
    description:
      "Ongoing emails that entertain and give value while making a soft pitch. Here are three ready-to-send samples you can model.",
    steps: [
      {
        purpose: "Entertain + hook",
        instruction:
          "Open with an entertaining, relatable everyday hook/story, then bridge naturally to one useful insight. Close with a light, soft mention of the offer.",
      },
      {
        purpose: "Value + soft pitch",
        instruction:
          "Lead with a genuinely useful tip or lesson tied to the reader's world, then connect it to the product with a soft pitch. Keep it warm and low-pressure.",
      },
      {
        purpose: "Direct-ish offer",
        instruction:
          "Tell a short story or make a clear point, then make a more direct (still friendly) invitation to take the offer. Give a concrete reason to act.",
      },
    ],
  },
  {
    type: "promo",
    label: "Promo / launch",
    description:
      "A timed sequence to drive a specific launch, sale, or deadline.",
    steps: [
      {
        purpose: "Announce",
        instruction:
          "Announce the launch/promo with excitement. Say what it is, who it's for, and the headline benefit. Include the key dates/terms and a clear CTA.",
      },
      {
        purpose: "Benefits & proof",
        instruction:
          "Go deeper on the benefits and outcomes. Add proof or a concrete example/scenario. Reinforce the offer and the CTA.",
      },
      {
        purpose: "Overcome objections",
        instruction:
          "Address the top 2-3 objections or hesitations honestly, and reframe them. Reassure the reader and restate the offer's value. Clear CTA.",
      },
      {
        purpose: "Last call",
        instruction:
          "Final email: honest urgency about the deadline/closing. Short, punchy recap of the transformation and a strong, direct last-call CTA.",
      },
    ],
  },
  {
    type: "reengagement",
    label: "Re-engagement",
    description:
      "Win back subscribers or trial users who have gone quiet.",
    steps: [
      {
        purpose: "We miss you",
        instruction:
          "A warm, no-guilt check-in. Acknowledge it's been a while, remind them why they signed up, and offer help. Low-pressure invitation to come back.",
      },
      {
        purpose: "What's new / value",
        instruction:
          "Share what's new or a fresh piece of value they've missed. Make returning feel worth it. Soft CTA to re-engage.",
      },
      {
        purpose: "Last chance / soft goodbye",
        instruction:
          "A respectful last-chance email: offer one clear reason to stay and an easy way to do so, and gracefully let them go if not. Keep dignity and warmth.",
      },
    ],
  },
];

export function getSequenceSpec(type: EmailSequenceType): EmailSequenceSpec {
  return (
    EMAIL_SEQUENCE_SPECS.find((s) => s.type === type) ??
    EMAIL_SEQUENCE_SPECS[0]
  );
}
