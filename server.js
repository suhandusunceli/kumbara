const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Veritabanı bağlantısı - PostgreSQL varsa onu kullan, yoksa SQLite
const DATABASE_URL = process.env.DATABASE_URL;
let db;
let dbType;

if (DATABASE_URL) {
  // PostgreSQL kullan (Render'da)
  dbType = 'postgres';
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  db = {
    query: (text, params) => pool.query(text, params),
    close: () => pool.end()
  };
  
  // Tabloyu oluştur
  pool.query(`
    CREATE TABLE IF NOT EXISTS contributions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).then(() => {
    console.log('PostgreSQL veritabanına bağlandı ve tablo hazır.');
  }).catch(err => {
    console.error('PostgreSQL tablo oluşturma hatası:', err.message);
  });
  
  console.log('PostgreSQL veritabanına bağlandı.');
} else {
  // SQLite kullan (local development)
  dbType = 'sqlite';
  db = new sqlite3.Database('./kumbara.db', (err) => {
    if (err) {
      console.error('Veritabanı bağlantı hatası:', err.message);
    } else {
      console.log('SQLite veritabanına bağlandı.');
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
}

// Veritabanı sorgu helper fonksiyonu
function dbQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      db.query(query, params)
        .then(result => resolve({ rows: result.rows, rowCount: result.rowCount }))
        .catch(reject);
    } else {
      if (query.includes('SELECT')) {
        if (query.includes('SUM') || query.includes('COUNT')) {
          // Tek satır döndüren sorgular
          db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve({ rows: [row], rowCount: 1 });
          });
        } else {
          // Çoklu satır döndüren sorgular
          db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
          });
        }
      } else {
        // INSERT, UPDATE, DELETE
        db.run(query, params, function(err) {
          if (err) reject(err);
          else resolve({ 
            rows: [{ id: this.lastID }], 
            rowCount: this.changes,
            lastID: this.lastID,
            changes: this.changes
          });
        });
      }
    }
  });
}

// API Routes

// Tüm katkıları getir
app.get('/api/contributions', async (req, res) => {
  try {
    const query = dbType === 'postgres' 
      ? 'SELECT * FROM contributions ORDER BY created_at DESC'
      : 'SELECT * FROM contributions ORDER BY created_at DESC';
    const result = await dbQuery(query);
    res.json(result.rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toplam miktarı getir
app.get('/api/total', async (req, res) => {
  try {
    const query = 'SELECT SUM(amount) as total FROM contributions';
    const result = await dbQuery(query);
    const total = result.rows && result.rows[0] ? (result.rows[0].total || 0) : 0;
    res.json({ total: parseFloat(total) || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni katkı ekle
app.post('/api/contributions', async (req, res) => {
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

  try {
    const query = dbType === 'postgres'
      ? 'INSERT INTO contributions (name, amount, message) VALUES ($1, $2, $3) RETURNING id'
      : 'INSERT INTO contributions (name, amount, message) VALUES (?, ?, ?)';
    
    const params = [name, amountNum, message || ''];
    const result = await dbQuery(query, params);
    
    const insertedId = dbType === 'postgres' 
      ? result.rows[0].id 
      : result.lastID;
    
    res.json({ 
      id: insertedId, 
      name, 
      amount: amountNum, 
      message: message || '',
      success: true 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Katkı sil
app.delete('/api/contributions/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    // Önce kaydı bul ve miktarını al
    const selectQuery = dbType === 'postgres'
      ? 'SELECT amount FROM contributions WHERE id = $1'
      : 'SELECT amount FROM contributions WHERE id = ?';
    
    const selectResult = await dbQuery(selectQuery, [id]);
    
    if (!selectResult.rows || selectResult.rows.length === 0) {
      res.status(404).json({ error: 'Katkı bulunamadı' });
      return;
    }
    
    // Kaydı sil
    const deleteQuery = dbType === 'postgres'
      ? 'DELETE FROM contributions WHERE id = $1'
      : 'DELETE FROM contributions WHERE id = ?';
    
    const deleteResult = await dbQuery(deleteQuery, [id]);
    
    res.json({ 
      success: true, 
      message: 'Katkı silindi',
      deletedAmount: selectResult.rows[0].amount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Kumbara sunucusu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`Linkinizi paylaşın: http://localhost:${PORT}`);
  console.log(`Veritabanı tipi: ${dbType}`);
});
