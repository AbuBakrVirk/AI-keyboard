import { cleanAIResponse } from '../services/ai/prompts';

describe('cleanAIResponse – preamble stripping', () => {
  // ── Should be stripped ──────────────────────────────────────────────────────
  const shouldStrip: Array<[string, string]> = [
    [
      'Here is the rewritten text: Hello world.',
      'Hello world.',
    ],
    [
      'Here is your corrected sentence: Sir, I am still facing the same issue.',
      'Sir, I am still facing the same issue.',
    ],
    [
      "Here's the corrected text: Good morning!",
      'Good morning!',
    ],
    [
      "Here's your improved message: Could you please send me the file?",
      'Could you please send me the file?',
    ],
    [
      'Rewritten text: Could you please send me the file?',
      'Could you please send me the file?',
    ],
    [
      'Corrected sentence: Sir, I am still facing the same issue.',
      'Sir, I am still facing the same issue.',
    ],
    [
      'Improved version: Please review the attached report.',
      'Please review the attached report.',
    ],
    [
      'Here you go! Please review the report.',
      'Please review the report.',
    ],
    [
      'Sure! Hello world.',
      'Hello world.',
    ],
    [
      'Sure. Hello world.',
      'Hello world.',
    ],
    [
      'Of course! Please send me the file.',
      'Please send me the file.',
    ],
    [
      'Certainly! Please send me the file.',
      'Please send me the file.',
    ],
    // Preserves emojis, URLs, names in the body
    [
      'Here is the rewritten text: Hey! 👋 Check https://example.com',
      'Hey! 👋 Check https://example.com',
    ],
  ];

  for (const [input, expected] of shouldStrip) {
    it(`strips preamble from: "${input.substring(0, 55)}..."`, () => {
      expect(cleanAIResponse(input)).toBe(expected);
    });
  }

  // ── Should NOT be stripped (genuine content) ────────────────────────────────
  const shouldNotStrip: Array<string> = [
    // "Here is my X" without a qualifier keyword + colon is a normal sentence
    'Here is my report for Q3.',
    'Here is the plan we discussed.',
    // "Sure thing" is not a bare "Sure!" preamble
    'Sure thing, I will send it tomorrow.',
    // Normal rewritten sentences
    'Sir, I am still facing the same issue.',
    'Could you please send me the file?',
    'I will review the report by tomorrow.',
  ];

  for (const input of shouldNotStrip) {
    it(`does NOT strip: "${input}"`, () => {
      expect(cleanAIResponse(input)).toBe(input);
    });
  }
});
