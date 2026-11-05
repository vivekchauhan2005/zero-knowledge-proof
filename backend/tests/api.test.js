const request = require('supertest');
const app = require('../server');
const {
  deriveScalar,
  computePublicKey,
  generateNonce,
  computeCommitment,
  computeResponse
} = require('../utils/schnorr');
const { EDUCATIONAL_PARAMS } = require('../config/constants');

describe('Schnorr ZKP API End-to-End Integration Tests', () => {
  const { p, q, g } = EDUCATIONAL_PARAMS;
  const testSecret = 'IntegrationTestSecret2026';
  const derived = deriveScalar(testSecret, q);
  const testX = derived.scalar;
  const testY = computePublicKey(testX, p, g);

  let activeSessionId = null;
  let activeChallenge = null;
  let activeNonce = null;

  test('1. GET /api/zkp/health returns healthy status', async () => {
    const res = await request(app).get('/api/zkp/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('2. GET /api/zkp/params returns public mathematical parameters', async () => {
    const res = await request(app).get('/api/zkp/params');
    expect(res.status).toBe(200);
    expect(res.body.educational.p).toBe('23');
    expect(res.body.educational.q).toBe('11');
    expect(res.body.educational.g).toBe('2');
  });

  test('3. POST /api/zkp/register registers a user public key', async () => {
    const res = await request(app)
      .post('/api/zkp/register')
      .send({
        username: 'bob_test',
        publicKey: testY.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.username).toBe('bob_test');
    expect(res.body.publicKey).toBe(testY.toString());
  });

  test('4. POST /api/zkp/register rejects invalid inputs', async () => {
    const res = await request(app)
      .post('/api/zkp/register')
      .send({ username: '', publicKey: '8' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('5. POST /api/zkp/commitment initializes session with commitment t', async () => {
    activeNonce = generateNonce(q);
    const t = computeCommitment(activeNonce, p, g);

    const res = await request(app)
      .post('/api/zkp/commitment')
      .send({
        username: 'bob_test',
        publicKey: testY.toString(),
        commitment: t.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.session).toHaveProperty('id');
    expect(res.body.session.commitment).toBe(t.toString());

    activeSessionId = res.body.session.id;
  });

  test('6. POST /api/zkp/challenge issues a random challenge for active session', async () => {
    const res = await request(app)
      .post('/api/zkp/challenge')
      .send({ sessionId: activeSessionId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('challenge');

    activeChallenge = BigInt(res.body.challenge);
    expect(activeChallenge).toBeGreaterThanOrEqual(1n);
    expect(activeChallenge).toBeLessThanOrEqual(q - 1n);
  });

  test('7. POST /api/zkp/verify successfully verifies honest response (ACCEPTED)', async () => {
    const z = computeResponse(activeNonce, activeChallenge, testX, q);

    const res = await request(app)
      .post('/api/zkp/verify')
      .send({
        sessionId: activeSessionId,
        response: z.toString()
      });

    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.equation.lhs).toBe(res.body.equation.rhs);
  });

  test('8. POST /api/zkp/verify rejects replayed challenge on already consumed session', async () => {
    // Attempting to re-verify the same consumed session
    const z = computeResponse(activeNonce, activeChallenge, testX, q);

    const res = await request(app)
      .post('/api/zkp/verify')
      .send({
        sessionId: activeSessionId,
        response: z.toString()
      });

    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(false);
    expect(res.body.status).toBe('REJECTED');
    expect(res.body.error).toContain('Replay attack prevented');
  });

  test('9. POST /api/zkp/verify rejects modified / tampered response', async () => {
    // Create new session
    const r = generateNonce(q);
    const t = computeCommitment(r, p, g);

    const commitRes = await request(app)
      .post('/api/zkp/commitment')
      .send({
        username: 'bob_test',
        publicKey: testY.toString(),
        commitment: t.toString()
      });
    const sId = commitRes.body.session.id;

    const chalRes = await request(app)
      .post('/api/zkp/challenge')
      .send({ sessionId: sId });
    const e = BigInt(chalRes.body.challenge);

    const honestZ = computeResponse(r, e, testX, q);
    const tamperedZ = (honestZ + 1n) % q;

    const verifyRes = await request(app)
      .post('/api/zkp/verify')
      .send({
        sessionId: sId,
        response: tamperedZ.toString()
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.isValid).toBe(false);
    expect(verifyRes.body.status).toBe('REJECTED');
    expect(verifyRes.body.equation.lhs).not.toBe(verifyRes.body.equation.rhs);
  });

  test('10. POST /api/zkp/verify rejects expired challenge session', async () => {
    // Create session with 1ms TTL
    const r = generateNonce(q);
    const t = computeCommitment(r, p, g);

    const commitRes = await request(app)
      .post('/api/zkp/commitment')
      .send({
        username: 'bob_test',
        publicKey: testY.toString(),
        commitment: t.toString(),
        ttlMs: 1 // immediate expiry
      });
    const sId = commitRes.body.session.id;

    // Wait 5ms for expiry
    await new Promise(res => setTimeout(res, 10));

    const verifyRes = await request(app)
      .post('/api/zkp/verify')
      .send({
        sessionId: sId,
        response: '5'
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.isValid).toBe(false);
    expect(verifyRes.body.status).toBe('REJECTED');
    expect(verifyRes.body.error).toContain('expired');
  });

  test('11. POST /api/zkp/verify rejects nonexistent / invalid session ID', async () => {
    const verifyRes = await request(app)
      .post('/api/zkp/verify')
      .send({
        sessionId: 'nonexistent-session-uuid-9999',
        response: '5'
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.isValid).toBe(false);
    expect(verifyRes.body.status).toBe('REJECTED');
    expect(verifyRes.body.error).toContain('Session not found');
  });

  test('12. POST /api/zkp/simulate verifies arbitrary parameters directly for attack lab', async () => {
    // Case A: Valid
    const simValid = await request(app)
      .post('/api/zkp/simulate')
      .send({ y: '8', t: '9', e: '4', z: '6' });
    expect(simValid.body.isValid).toBe(true);
    expect(simValid.body.status).toBe('ACCEPTED');

    // Case B: Tampered
    const simTampered = await request(app)
      .post('/api/zkp/simulate')
      .send({ y: '8', t: '9', e: '4', z: '7' });
    expect(simTampered.body.isValid).toBe(false);
    expect(simTampered.body.status).toBe('REJECTED');
  });

  test('13. GET /api/zkp/history returns recorded audit trail and DELETE clears it', async () => {
    const histRes = await request(app).get('/api/zkp/history');
    expect(histRes.status).toBe(200);
    expect(Array.isArray(histRes.body)).toBe(true);
    expect(histRes.body.length).toBeGreaterThan(0);

    // Ensure audit entries never expose secret x or nonce r
    const entry = histRes.body[0];
    expect(entry).not.toHaveProperty('x');
    expect(entry).not.toHaveProperty('r');
    expect(entry).not.toHaveProperty('secret');
    expect(entry).toHaveProperty('status');

    // Clear history
    const delRes = await request(app).delete('/api/zkp/history');
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const emptyHist = await request(app).get('/api/zkp/history');
    expect(emptyHist.body).toEqual([]);
  });
});

