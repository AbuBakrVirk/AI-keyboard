import { cleanAIResponse } from '../services/ai/prompts';

describe('cleanAIResponse – preamble stripping', () => {
  const cases: [string, string][] = [
    // Preamble patterns that Gemini sometimes adds
    ['Here is the rewritten text: Hello world.', 'Hello world.'],
    ['Here is your corrected sentence: Sir, I am still facing the same issue.', 'Sir, I am still facing the same issue.'],
    ["Here's the corrected text: Good morning!", 'Good morning!'],
    ['Sure! Hello world.', 'Hello world.'],
    ['Sure, Hello world.', 'Hello world.'],
    ['Of course! Please send me the file.', 'Please send me the file.'],
    ['Certainly! Please send me the file.', 'Please send me the file.'],
    ['Here you go! Please review the report.', 'Please review the report.'],
    ['Rewritten text: Could you please send me the file?', 'Could you please send me the file?'],
    ['Corrected sentence: Sir, I am still facing the same issue.', 'Sir, I am still facing the same issue.'],

    // Should NOT strip normal content
    ['Sir, I am still facing the same issue.', 'Sir, I am still facing the same issue.'],
    ['Sure thing, I will send it tomorrow.', 'Sure thing, I will send it tomorrow.'], // "Sure thing" is not a preamble
    ['Here is my report for Q3.', 'Here is my report for Q3.'], // sentence that starts with "Here is" but is content

    // Preserve emojis, URLs, names
    ['Here is the rewritten text: Hey! 👋 Check https://example.com', 'Hey! 👋 Check https://example.com'],
  ];

  for (const [input, expected] of cases) {
    it(`cleans: "${input.substring(0, 50)}..."`, () => {
      expect(cleanAIResponse(input)).toBe(expected);
    });
  }
});
