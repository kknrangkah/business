import jwt from '../../pm1-backend/node_modules/jsonwebtoken/index.js';
import pg from '../../pm1-backend/node_modules/pg/lib/index.js';
const { Client } = pg;

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'praktik-mandiri'
  });
  await client.connect();

  const roles = await client.query("SELECT id, name FROM roles WHERE name IN ('dokter', 'perawat', 'kasir', 'apoteker', 'admin')");
  console.log('Testing roles from DB:', roles.rows.map(r => r.name));

  const token = jwt.sign(
    { id: 'f1e2d3c4-b5a6-7988-970d-1e2f3a4b5c6d', email: 'admin@gmail.com', name: 'Admin', role: 'admin' },
    'secretKey',
    { expiresIn: '1d' }
  );

  for (const r of roles.rows) {
    const res = await fetch(`http://localhost:30005/v1/menus/role/${r.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    console.log(`\nRole "${r.name}" has ${json?.data?.length || 0} menus from backend:`);
    const menuNames = (json?.data || []).map(m => `${m.name} (${m.path})`);
    const pRes = await fetch(`http://localhost:30005/v1/permissions/role/${r.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const pJson = await pRes.json();
    console.log(`Role "${r.name}" has ${pJson?.data?.length || 0} permissions from backend:`);
    const permNames = (pJson?.data || []).slice(0, 10).map(p => p.name);
    console.log(permNames.join(', ') + (pJson?.data?.length > 10 ? ' ...' : ''));
  }

  await client.end();
}

test().catch(console.error);
