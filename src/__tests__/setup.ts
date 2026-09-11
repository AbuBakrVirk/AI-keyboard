/**
 * Jest global setup – runs before all test files.
 * Forces mock provider so tests never call a real AI API.
 */
process.env['AI_PROVIDER'] = 'mock';
process.env['AI_API_KEY'] = ''; // not needed for mock
process.env['GEMINI_API_KEY'] = ''; // not needed for mock
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '5001';
process.env['RATE_LIMIT_MAX_REQUESTS'] = '1000'; // effectively disabled in tests
process.env['MAX_TEXT_LENGTH'] = '5000';
process.env['MAX_INSTRUCTION_LENGTH'] = '1000';
process.env['ALLOWED_ORIGINS'] = '';
