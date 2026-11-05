/**
 * Validation Middleware for ZKP API
 */

function validateRegister(req, res, next) {
  const { username, publicKey } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid username: username must be a non-empty string'
    });
  }
  if (!publicKey || (typeof publicKey !== 'string' && typeof publicKey !== 'number')) {
    return res.status(400).json({
      error: 'Invalid public key: publicKey is required (integer string or number)'
    });
  }
  try {
    const y = BigInt(publicKey);
    if (y <= 0n) {
      return res.status(400).json({ error: 'Public key must be positive' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Public key must be a valid integer' });
  }
  next();
}

function validateCommitment(req, res, next) {
  const { username, publicKey, commitment } = req.body;
  if (!commitment || (typeof commitment !== 'string' && typeof commitment !== 'number')) {
    return res.status(400).json({
      error: 'Invalid commitment: commitment (t) is required (integer string or number)'
    });
  }
  try {
    const t = BigInt(commitment);
    if (t <= 0n) {
      return res.status(400).json({ error: 'Commitment t must be positive' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Commitment t must be a valid integer' });
  }
  next();
}

function validateChallenge(req, res, next) {
  const { sessionId } = req.body;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'Invalid sessionId: sessionId string is required'
    });
  }
  next();
}

function validateVerify(req, res, next) {
  const { sessionId, response } = req.body;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'Invalid sessionId: sessionId string is required'
    });
  }
  if (response === undefined || response === null || (typeof response !== 'string' && typeof response !== 'number')) {
    return res.status(400).json({
      error: 'Invalid response: response (z) is required (integer string or number)'
    });
  }
  try {
    BigInt(response);
  } catch (e) {
    return res.status(400).json({ error: 'Response z must be a valid integer' });
  }
  next();
}

module.exports = {
  validateRegister,
  validateCommitment,
  validateChallenge,
  validateVerify
};

