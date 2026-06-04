/**
 * Firebase Cloud Functions - Key validation & tracking system
 * Tracks: IP, timestamp, script launch, usage count, anomalies
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const geoip = require('geoip-lite');

admin.initializeApp();
const db = admin.firestore();

/**
 * HTTP Endpoint: Validate key & track usage
 * Expected POST body: { key, gameName, executor, hwid }
 * Returns: { valid: bool, message, launchId }
 */
exports.validateKey = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    const { key, gameName, executor, hwid } = req.body;
    if (!key || !gameName) return res.json({ valid: false, message: 'Missing key or gameName' });

    // Get IP info
    const clientIp = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    const geoData = geoip.lookup(clientIp) || {};

    // Check if key exists & is valid
    const keySnap = await db.collection('keys').doc(key).get();
    if (!keySnap.exists()) {
      recordFailedAttempt(key, clientIp, gameName, 'KEY_NOT_FOUND');
      return res.json({ valid: false, message: 'Key not found' });
    }

    const keyData = keySnap.data();

    // Validation checks
    if (keyData.blacklisted) {
      recordFailedAttempt(key, clientIp, gameName, 'KEY_BLACKLISTED');
      return res.json({ valid: false, message: 'Key is blacklisted' });
    }

    if (!keyData.active) {
      recordFailedAttempt(key, clientIp, gameName, 'KEY_NOT_ACTIVE');
      return res.json({ valid: false, message: 'Key not activated' });
    }

    if (keyData.expiresAt && Date.now() > keyData.expiresAt) {
      recordFailedAttempt(key, clientIp, gameName, 'KEY_EXPIRED');
      return res.json({ valid: false, message: 'Key expired' });
    }

    // ✅ KEY IS VALID - Record the launch
    const launchId = db.collection('keyLaunches').doc().id;
    const launchData = {
      id: launchId,
      key,
      gameName: keyData.gameName || gameName,
      executor: executor || 'unknown',
      hwid: hwid || null,
      clientIp,
      country: geoData.country || 'XX',
      city: geoData.city || 'Unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'success',
    };

    // Save launch record
    await db.collection('keyLaunches').doc(launchId).set(launchData);

    // Update key stats
    await db.collection('keys').doc(key).update({
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: admin.firestore.FieldValue.increment(1),
      lastIp: clientIp,
      lastExecutor: executor || 'unknown',
    });

    // Update game usage stats
    const gameStatsRef = db.collection('gameStats').doc(keyData.gameName || 'unknown');
    const gameSnap = await gameStatsRef.get();
    if (gameSnap.exists()) {
      await gameStatsRef.update({
        launches: admin.firestore.FieldValue.increment(1),
        lastLaunch: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await gameStatsRef.set({
        gameName: keyData.gameName || 'unknown',
        launches: 1,
        lastLaunch: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Check for suspicious activity (multiple IPs in 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    const recentLaunches = await db.collection('keyLaunches')
      .where('key', '==', key)
      .where('timestamp', '>=', new Date(oneHourAgo))
      .get();

    const uniqueIps = new Set(recentLaunches.docs.map(d => d.data().clientIp));
    if (uniqueIps.size > 3) {
      await recordAnomaly(key, clientIp, 'MULTIPLE_IPS', `${uniqueIps.size} different IPs in 1 hour`);
    }

    // Log success
    await addLog('KEY_VALIDATED', {
      key,
      gameName: keyData.gameName,
      executor,
      clientIp,
      launchId,
    });

    return res.json({ valid: true, message: 'Key valid', launchId });

  } catch (error) {
    console.error('Error validating key:', error);
    return res.json({ valid: false, message: 'Server error', error: error.message });
  }
});

/**
 * Record failed validation attempt
 */
async function recordFailedAttempt(key, ip, gameName, reason) {
  await db.collection('failedAttempts').add({
    key,
    ip,
    gameName,
    reason,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  await addLog('KEY_VALIDATION_FAILED', { key, reason, ip });
}

/**
 * Record suspicious activity
 */
async function recordAnomaly(key, ip, type, description) {
  await db.collection('anomalies').add({
    key,
    type,
    description,
    suspiciousIp: ip,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    reviewed: false,
  });

  await addLog('ANOMALY_DETECTED', { key, type, description });
}

/**
 * Log admin action
 */
async function addLog(action, details) {
  await db.collection('logs').add({
    action,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    adminEmail: 'system',
    ...details,
  }).catch(() => {});
}

/**
 * Get analytics for admin dashboard
 */
exports.getAnalytics = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  try {
    const now = Date.now();
    const last24h = now - 86400000;
    const last7d = now - 604800000;

    // Get launches in last 24h
    const launches24h = await db.collection('keyLaunches')
      .where('timestamp', '>=', new Date(last24h))
      .get();

    // Get launches in last 7 days
    const launches7d = await db.collection('keyLaunches')
      .where('timestamp', '>=', new Date(last7d))
      .get();

    // Get failed attempts
    const failedAttempts = await db.collection('failedAttempts')
      .where('timestamp', '>=', new Date(last24h))
      .get();

    // Get anomalies
    const anomalies = await db.collection('anomalies')
      .where('timestamp', '>=', new Date(last24h))
      .where('reviewed', '==', false)
      .get();

    // Top used keys
    const allKeys = await db.collection('keys').get();
    const topKeys = allKeys.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10);

    // Top games
    const gameStats = await db.collection('gameStats').get();
    const topGames = gameStats.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.launches || 0) - (a.launches || 0))
      .slice(0, 10);

    res.json({
      stats: {
        launches24h: launches24h.size,
        launches7d: launches7d.size,
        failedAttempts24h: failedAttempts.size,
        unreviewed_anomalies: anomalies.size,
      },
      topKeys: topKeys.map(k => ({
        key: k.id,
        usageCount: k.usageCount || 0,
        lastUsed: k.lastUsed,
        lastIp: k.lastIp,
        status: k.active ? 'active' : 'inactive',
      })),
      topGames: topGames.map(g => ({
        gameName: g.gameName,
        launches: g.launches || 0,
        lastLaunch: g.lastLaunch,
      })),
      recentAnomalies: anomalies.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 5),
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    res.json({ error: error.message });
  }
});

/**
 * Get detailed key usage history
 */
exports.getKeyHistory = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  try {
    const { key } = req.query;
    if (!key) return res.json({ error: 'Missing key parameter' });

    const launches = await db.collection('keyLaunches')
      .where('key', '==', key)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const failed = await db.collection('failedAttempts')
      .where('key', '==', key)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    res.json({
      launches: launches.docs.map(d => ({ id: d.id, ...d.data() })),
      failedAttempts: failed.docs.map(d => ({ id: d.id, ...d.data() })),
    });

  } catch (error) {
    console.error('Error getting key history:', error);
    res.json({ error: error.message });
  }
});
