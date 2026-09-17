const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración del pool de conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Creación automática de tablas si no existen
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id VARCHAR(50) PRIMARY KEY, name TEXT, category TEXT, price NUMERIC, stock INT, min INT, icon TEXT
      );
      CREATE TABLE IF NOT EXISTS clientes (
        id VARCHAR(50) PRIMARY KEY, name TEXT, phone TEXT, address TEXT, notes TEXT, orders INT, total NUMERIC
      );
      CREATE TABLE IF NOT EXISTS pedidos (
        id VARCHAR(50) PRIMARY KEY, customer TEXT, items TEXT, date TEXT, time TEXT, delivery TEXT, total NUMERIC, status TEXT, address TEXT
      );
      CREATE TABLE IF NOT EXISTS caja (
        id VARCHAR(50) PRIMARY KEY, date TEXT, time TEXT, concept TEXT, method TEXT, type TEXT, amount NUMERIC
      );
    `);
    console.log('🟢 Base de datos PostgreSQL inicializada correctamente.');
  } catch (err) {
    console.error('⚠️ Error al inicializar la base de datos:', err.message);
  }
};
initDatabase();

// --- ENDPOINTS DE LA API ---

// PRODUCTOS
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { id, name, category, price, stock, min, icon } = req.body;
  try {
    await pool.query(`
      INSERT INTO productos (id, name, category, price, stock, min, icon)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, category = EXCLUDED.category, price = EXCLUDED.price,
        stock = EXCLUDED.stock, min = EXCLUDED.min, icon = EXCLUDED.icon
    `, [id, name, category, price, stock, min, icon]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  try {
    await pool.query('UPDATE productos SET stock = $1 WHERE id = $2', [stock, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLIENTES
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { id, name, phone, address, notes, orders, total } = req.body;
  try {
    await pool.query(`
      INSERT INTO clientes (id, name, phone, address, notes, orders, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, phone = EXCLUDED.phone, address = EXCLUDED.address,
        notes = EXCLUDED.notes, orders = EXCLUDED.orders, total = EXCLUDED.total
    `, [id, name, phone, address, notes, orders || 0, total || 0]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PEDIDOS
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY date DESC, time DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { id, customer, items, date, time, delivery, total, status, address } = req.body;
  try {
    await pool.query(`
      INSERT INTO pedidos (id, customer, items, date, time, delivery, total, status, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [id, customer, items, date, time, delivery, total, status, address]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CAJA
app.get('/api/cash', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM caja ORDER BY date DESC, time DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cash', async (req, res) => {
  const { id, date, time, concept, method, type, amount } = req.body;
  try {
    await pool.query(`
      INSERT INTO caja (id, date, time, concept, method, type, amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, date, time, concept, method, type, amount]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});