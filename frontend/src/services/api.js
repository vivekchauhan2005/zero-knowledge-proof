/**
 * API Service for Communicating with Express Verifier Backend
 */

const BASE_URL = '/api/zkp';

export const api = {
  /**
   * Health check
   */
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  /**
   * Public parameters
   */
  async getParams() {
    const res = await fetch(`${BASE_URL}/params`);
    if (!res.ok) throw new Error(`Failed to fetch parameters: ${res.statusText}`);
    return res.json();
  },

  /**
   * Register user public key y
   */
  async registerUser(username, publicKey) {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, publicKey: publicKey.toString() })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    return data;
  },

  /**
   * Submit commitment t = g^r mod p
   */
  async submitCommitment(username, publicKey, commitment, ttlMs) {
    const res = await fetch(`${BASE_URL}/commitment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        publicKey: publicKey.toString(),
        commitment: commitment.toString(),
        ttlMs
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit commitment');
    return data;
  },

  /**
   * Request challenge e from Verifier
   */
  async requestChallenge(sessionId) {
    const res = await fetch(`${BASE_URL}/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get challenge');
    return data;
  },

  /**
   * Submit proof response z = (r + e * x) mod q
   */
  async submitProof(sessionId, responseZ) {
    const res = await fetch(`${BASE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        response: responseZ.toString()
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification request failed');
    return data;
  },

  /**
   * Negative testing / Attack Simulation Lab
   */
  async simulateDirect(scenarioPayload) {
    const res = await fetch(`${BASE_URL}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenarioPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Simulation failed');
    return data;
  },

  /**
   * Fetch audit history
   */
  async getHistory(filter = 'ALL') {
    const url = filter && filter !== 'ALL' 
      ? `${BASE_URL}/history?filter=${encodeURIComponent(filter)}`
      : `${BASE_URL}/history`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  /**
   * Clear audit history
   */
  async clearHistory() {
    const res = await fetch(`${BASE_URL}/history`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear history');
    return res.json();
  }
};

