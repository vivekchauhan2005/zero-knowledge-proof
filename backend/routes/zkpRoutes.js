const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/zkpController');

const {
  validateRegister,
  validateCommitment,
  validateChallenge,
  validateVerify
} = require('../middleware/validator');

// Health & Public Metadata
router.get('/health', getHealth);
router.get('/params', getParameters);

// User & Public Key Management
router.post('/register', validateRegister, registerUser);
router.get('/users', getUsers);

// Schnorr ZKP Protocol Workflow
router.post('/commitment', validateCommitment, createCommitment);
router.post('/challenge', validateChallenge, issueChallenge);
router.post('/verify', validateVerify, verifyResponse);

// Attack Simulation Lab & Direct Verification
router.post('/simulate', simulateDirect);

// Audit History & Sessions
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.get('/session/:id', getSessionById);

module.exports = router;

