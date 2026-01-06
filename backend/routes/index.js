import pool from './db.js';

async function testConnection() {
  const result = await pool.query('SELECT now()');
  console.log(result.rows);
}

testConnection();