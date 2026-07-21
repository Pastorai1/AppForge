/**
 * The ordered sections of a Perfect Webinar-style presentation. The
 * Presentations tool generates one section at a time (fast-batch) grounded in
 * the Brain + chosen voice, keeping the whole script coherent via a running
 * summary of prior sections.
 */

export interface PresentationSectionSpec {
  key: string;
  title: string;
  instruction: string;
}

export const PRESENTATION_SECTIONS: PresentationSectionSpec[] = [
  {
    key: "hook",
    title: "Hook & Big Promise",
    instruction:
      "Write the introduction: the hook and the big promise. Grab attention fast, state the single big result the audience will learn how to get by the end, and set the stage. Build curiosity and tell them to stay to the end.",
  },
  {
    key: "big_domino",
    title: "The Big Domino",
    instruction:
      "State the Big Domino: the ONE belief that, if the audience accepts it, makes taking the offer the only logical choice. Introduce the new opportunity/vehicle as the key to the result, and contrast it with the old way that hasn't worked for them.",
  },
  {
    key: "origin",
    title: "Origin Story",
    instruction:
      "Tell the origin/backstory that earns trust: the struggle, the search, and the discovery of this vehicle. Keep it authentic and relatable, in the character's voice. Make the audience feel understood.",
  },
  {
    key: "secret_vehicle",
    title: "Secret #1 — The Vehicle",
    instruction:
      "Secret #1 — break and rebuild the false belief about the VEHICLE (the opportunity/approach itself): 'does this even work for someone like me?' Use a short epiphany-bridge story that shifts their belief, then state the new belief they should hold.",
  },
  {
    key: "secret_internal",
    title: "Secret #2 — Internal Beliefs",
    instruction:
      "Secret #2 — break and rebuild INTERNAL beliefs ('I don't think I personally can do this'). Address self-doubt and capability with an epiphany story, then reframe so they believe they can succeed with this.",
  },
  {
    key: "secret_external",
    title: "Secret #3 — External Beliefs",
    instruction:
      "Secret #3 — break and rebuild EXTERNAL beliefs ('even if it works and I can do it, outside forces will stop me' — time, money, family, circumstances). Reframe those objections honestly so they no longer block the decision.",
  },
  {
    key: "stack",
    title: "The Stack",
    instruction:
      "The Stack: present the full offer as a stack of components, each with its own value, building to a total value that dwarfs the price. List each element clearly and why it matters to the result.",
  },
  {
    key: "close",
    title: "The Close",
    instruction:
      "The Close: reveal the price in the context of the stacked value, add a strong and honest guarantee/risk-reversal, real urgency or scarcity (never fake), and a clear call to action. Include two or three trial closes.",
  },
];
