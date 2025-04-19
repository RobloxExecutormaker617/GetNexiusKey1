const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('nexius_keys.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        db.run(`
            CREATE TABLE IF NOT EXISTS keys (
                key TEXT PRIMARY KEY,
                ip TEXT NOT NULL,
                used INTEGER DEFAULT 0
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS ip_keys (
                ip TEXT PRIMARY KEY,
                key TEXT NOT NULL
            )
        `);
    }
});

app.post('/register-key', (req, res) => {
    const { key, ip } = req.body;
    if (!key || !ip) {
        return res.status(400).json({ success: false, message: 'Missing key or IP' });
    }

    // Check if IP already used a key
    db.get('SELECT key FROM ip_keys WHERE ip = ?', [ip], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (row) {
            return res.status(403).json({ success: false, message: 'IP already used a key' });
        }

        // Store key and IP
        db.run('INSERT INTO keys (key, ip) VALUES (?, ?)', [key, ip], (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to register key' });
            }
            db.run('INSERT INTO ip_keys (ip, key) VALUES (?, ?)', [ip, key], (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Failed to register IP' });
                }
                res.json({ success: true, message: 'Key registered' });
            });
        });
    });
});

app.post('/validate-key', (req, res) => {
    const { key, ip } = req.body;
    if (!key || !ip) {
        return res.status(400).json({ success: false, message: 'Missing key or IP' });
    }

    db.get('SELECT ip, used FROM keys WHERE key = ?', [key], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: 'Key not found' });
        }
        if (row.used) {
            return res.status(403).json({ success: false, message: 'Key already used' });
        }
        if (row.ip !== ip) {
            return res.status(403).json({ success: false, message: 'Key registered to another IP' });
        }

        // Mark key as used
        db.run('UPDATE keys SET used = 1 WHERE key = ?', [key], (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to update key' });
            }
            res.json({ success: true, message: 'Key validated' });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
