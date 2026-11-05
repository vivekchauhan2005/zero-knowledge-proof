const zkpService = require('../services/zkpService');

/**
 * Controller handling ZKP identification endpoints
 */

const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    service: 'Zero Knowledge Proof (Schnorr) Authentication Verifier API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};

const getParameters = (req, res) => {
  try {
    const params = zkpService.getParameters();
    res.json(params);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const registerUser = (req, res) => {
  try {
    const { username, publicKey } = req.body;
    const result = zkpService.registerUser(username, publicKey);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getUsers = (req, res) => {
  try {
    const users = zkpService.listUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCommitment = (req, res) => {
  try {
    const { username, publicKey, commitment, ttlMs } = req.body;
    const session = zkpService.createSession(username, publicKey, commitment, ttlMs);
    res.status(201).json({
      success: true,
      message: 'Commitment received. Session initialized.',
      session: session.toJSON()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const issueChallenge = (req, res) => {
  try {
    const { sessionId } = req.body;
    const challengeData = zkpService.issueChallenge(sessionId);
    res.json({
      success: true,
      message: 'Cryptographically secure challenge generated',
      ...challengeData
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const verifyResponse = (req, res) => {
  try {
    const { sessionId, response } = req.body;
    const result = zkpService.verifySessionResponse(sessionId, response);
    
    // Return HTTP 200 with result object containing isValid
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const simulateDirect = (req, res) => {
  try {
    const { y, t, e, z, scenario } = req.body;
    const result = zkpService.verifyDirect({ y, t, e, z });
    res.json({
      scenario: scenario || 'Custom simulation',
      ...result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getHistory = (req, res) => {
  try {
    const { filter } = req.query; // 'ALL' | 'ACCEPTED' | 'REJECTED'
    const history = zkpService.getAuditHistory(filter);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const clearHistory = (req, res) => {
  try {
    const result = zkpService.clearAuditHistory();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSessionById = (req, res) => {
  try {
    const session = zkpService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getHealth,
  getParameters,
  registerUser,
  getUsers,
  createCommitment,
  issueChallenge,
  verifyResponse,
  simulateDirect,
  getHistory,
  clearHistory,
  getSessionById
};

