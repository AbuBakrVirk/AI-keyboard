import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: 'ok' });
  });

  it('does not expose internal server details', async () => {
    const res = await request(app).get('/health');
    expect(res.body).not.toHaveProperty('apiKey');
    expect(res.body).not.toHaveProperty('provider');
  });
});
