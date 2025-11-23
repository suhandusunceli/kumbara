const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Veritabanı bağlantısı
const db = new sqlite3.Database('./kumbara.db', (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('Veritabanına bağlandı.');
    // Tabloyu oluştur
    db.run(`CREATE TABLE IF NOT EXISTS contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Tablo oluşturma hatası:', err.message);
      }
    });
  }
});

// API Routes

// Tüm katkıları getir
app.get('/api/contributions', (req, res) => {
  db.all('SELECT * FROM contributions ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Toplam miktarı getir
app.get('/api/total', (req, res) => {
  db.get('SELECT SUM(amount) as total FROM contributions', [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ total: row.total || 0 });
  });
});

// Yeni katkı ekle
app.post('/api/contributions', (req, res) => {
  const { name, amount, message } = req.body;
  
  if (!name || !amount) {
    res.status(400).json({ error: 'İsim ve miktar zorunludur' });
    return;
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    res.status(400).json({ error: 'Geçerli bir miktar giriniz' });
    return;
  }

  db.run(
    'INSERT INTO contributions (name, amount, message) VALUES (?, ?, ?)',
    [name, amountNum, message || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        name, 
        amount: amountNum, 
        message: message || '',
        success: true 
      });
    }
  );
});

// Katkı sil
app.delete('/api/contributions/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM contributions WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Katkı bulunamadı' });
      return;
    }
    res.json({ success: true, message: 'Katkı silindi' });
  });
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Kumbara sunucusu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`Linkinizi paylaşın: http://localhost:${PORT}`);
});

