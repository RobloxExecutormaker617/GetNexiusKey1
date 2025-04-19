const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage (replace with database)
const keyStore = new Map();

app.post('/register-key', (req, res) => {
    const { key, ip } = req.body;
    if (!key || !ip) {
        return res.status(400).json({ success: false, message: 'Missing key or IP' });
    }

    // Check if IP already used a key
    for (let [storedKey, storedIp] of keyStore) {
        if (storedIp === ip && storedKey !== key) {
            return res.status(403).json({ success: false, message: 'IP already used a different key' });
        }
    }

    // Store key-IP mapping
    keyStore.set(key, ip);
    res.json({ success: true, message: 'Key registered' });
});

app.post('/validate-key', (req, res) => {
    const { key, ip } = req.body;
    if (!key || !ip) {
        return res.status(400).json({ success: false, message: 'Missing key or IP' });
    }

    const storedIp = keyStore.get(key);
    if (!storedIp) {
        return res.status(404).json({ success: false, message: 'Key not found' });
    }
    if (storedIp !== ip) {
        return res.status(403).json({ success: false, message: 'Key used by another IP' });
    }

    // Mark key as used (optional: remove from store)
    keyStore.delete(key);
    res.json({ success: true, message: 'Key validated' });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
