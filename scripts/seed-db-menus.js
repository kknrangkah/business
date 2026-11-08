const path = require('path');
const { Client } = require(path.resolve('../pm1-backend/node_modules/pg'));
const { randomUUID } = require('crypto');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'praktik-mandiri'
});

async function run() {
  await client.connect();

  console.log('1. Checking and adding /laboratory and /radiology menus...');
  const existingLab = await client.query("SELECT id FROM menus WHERE path = '/laboratory'");
  if (existingLab.rows.length === 0) {
    const labId = '22222222-0000-0000-0000-000000000003';
    await client.query(`
      INSERT INTO menus (id, slug, name, path, icon, type, parent_id, category_id, "order", is_active, created_at, updated_at)
      VALUES ($1, 'laboratorium-klinis', 'Laboratorium Klinis', '/laboratory', 'Microscope', 'item', NULL, 'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5002', 3, true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [labId]);
    console.log('Inserted /laboratory menu');
  } else {
    console.log('/laboratory already exists');
  }

  const existingRadio = await client.query("SELECT id FROM menus WHERE path = '/radiology'");
  if (existingRadio.rows.length === 0) {
    const radioId = '22222222-0000-0000-0000-000000000004';
    await client.query(`
      INSERT INTO menus (id, slug, name, path, icon, type, parent_id, category_id, "order", is_active, created_at, updated_at)
      VALUES ($1, 'radiologi-usg', 'Radiologi & USG', '/radiology', 'ScanLine', 'item', NULL, 'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5002', 4, true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [radioId]);
    console.log('Inserted /radiology menu');
  } else {
    console.log('/radiology already exists');
  }

  console.log('\n2. Ensuring clinical roles in "roles" table...');
  const rolesToEnsure = [
    { name: 'dokter', guard_name: 'web' },
    { name: 'perawat', guard_name: 'web' },
    { name: 'kasir', guard_name: 'web' },
    { name: 'apoteker', guard_name: 'web' },
    { name: 'superadmin', guard_name: 'web' },
    { name: 'saas_admin', guard_name: 'web' },
  ];

  for (const r of rolesToEnsure) {
    const found = await client.query('SELECT id FROM roles WHERE LOWER(name) = LOWER($1)', [r.name]);
    if (found.rows.length === 0) {
      const newId = randomUUID();
      await client.query(
        'INSERT INTO roles (id, name, guard_name, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [newId, r.name, r.guard_name]
      );
      console.log(`Created role: ${r.name} (${newId})`);
    } else {
      console.log(`Role ${r.name} already exists (${found.rows[0].id})`);
    }
  }

  // Get all roles
  const allRolesRes = await client.query('SELECT id, name FROM roles');
  const roleMap = {};
  for (const r of allRolesRes.rows) {
    roleMap[r.name.toLowerCase()] = r.id;
  }

  // Get all menus
  const allMenusRes = await client.query('SELECT id, name, path, parent_id FROM menus');
  const menuByPath = {};
  const menuByName = {};
  for (const m of allMenusRes.rows) {
    if (m.path && m.path !== '#') menuByPath[m.path] = m;
    menuByName[m.name] = m;
  }

  console.log('\n3. Configuring role_menu_access for each clinical role...');

  // Helper to add menu and its children or parents
  async function assignMenusToRole(roleName, pathsOrNames) {
    const roleId = roleMap[roleName.toLowerCase()];
    if (!roleId) return;

    // Collect all menu IDs to assign
    const menuIdsToAssign = new Set();
    for (const item of pathsOrNames) {
      const byP = menuByPath[item];
      if (byP) {
        menuIdsToAssign.add(byP.id);
        if (byP.parent_id) menuIdsToAssign.add(byP.parent_id);
      }
      const byN = menuByName[item];
      if (byN) {
        menuIdsToAssign.add(byN.id);
        if (byN.parent_id) menuIdsToAssign.add(byN.parent_id);
      }
    }

    // Also include any children of parents that were explicitly included
    for (const m of allMenusRes.rows) {
      if (m.parent_id && menuIdsToAssign.has(m.parent_id)) {
        if (pathsOrNames.includes(m.path) || pathsOrNames.includes(m.name)) {
          menuIdsToAssign.add(m.id);
        }
      }
    }

    for (const menuId of menuIdsToAssign) {
      const existing = await client.query(
        'SELECT id FROM role_menu_access WHERE role_id = $1 AND menu_id = $2',
        [roleId, menuId]
      );
      if (existing.rows.length === 0) {
        await client.query(
          'INSERT INTO role_menu_access (id, role_id, menu_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
          [randomUUID(), roleId, menuId]
        );
      }
    }
    console.log(`Assigned ${menuIdsToAssign.size} menus to role "${roleName}"`);
  }

  // Define menu paths for each role
  await assignMenusToRole('dokter', [
    '/dashboard',
    '/queue',
    '/queue/display',
    '/registration',
    '/patients',
    '/medical-record',
    '/laboratory',
    '/radiology',
    '/medications',
    '/reports',
    '/reports/visits',
    '/reports/revenue',
    '/reports/honorarium',
    '/reports/stock-opname',
    '/saas/plans',
    '/saas/billing',
    '/settings/account'
  ]);

  await assignMenusToRole('perawat', [
    '/dashboard',
    '/queue',
    '/queue/display',
    '/registration',
    '/patients',
    '/medical-record',
    '/laboratory',
    '/radiology',
    '/settings/account'
  ]);

  await assignMenusToRole('kasir', [
    '/dashboard',
    '/queue',
    '/queue/display',
    '/registration',
    '/patients',
    '/billing',
    '/reports',
    '/reports/revenue',
    '/saas/plans',
    '/saas/billing',
    '/settings/account'
  ]);

  await assignMenusToRole('apoteker', [
    '/dashboard',
    '/queue',
    '/queue/display',
    '/patients',
    '/medications',
    '/reports',
    '/reports/stock-opname',
    '/settings/account'
  ]);

  // For admin and superadmin, give all menus
  const allMenuIds = allMenusRes.rows.map(m => m.path || m.name);
  await assignMenusToRole('superadmin', allMenuIds);
  await assignMenusToRole('saas_admin', allMenuIds);
  await assignMenusToRole('admin', allMenuIds);

  console.log('\n4. Syncing role_has_permissions for clinical roles...');
  const allPermsRes = await client.query('SELECT id, name FROM permissions');
  const permMap = {};
  for (const p of allPermsRes.rows) {
    permMap[p.name] = p.id;
  }

  async function assignPermsToRole(roleName, permNames) {
    const roleId = roleMap[roleName.toLowerCase()];
    if (!roleId) return;

    for (const pName of permNames) {
      const permId = permMap[pName];
      if (!permId) continue;
      const existing = await client.query(
        'SELECT * FROM role_has_permissions WHERE role_id = $1 AND permission_id = $2',
        [roleId, permId]
      );
      if (existing.rows.length === 0) {
        await client.query(
          'INSERT INTO role_has_permissions (permission_id, role_id) VALUES ($1, $2)',
          [permId, roleId]
        );
      }
    }
    console.log(`Assigned ${permNames.length} permissions to role "${roleName}"`);
  }

  await assignPermsToRole('dokter', [
    'view_visit', 'create_visit', 'update_visit_status',
    'view_patient', 'create_patient', 'edit_patient',
    'view_medical_record', 'create_medical_record', 'edit_medical_record',
    'view_medication', 'view_clinical_report', 'view_doctor', 'view_procedure'
  ]);

  await assignPermsToRole('perawat', [
    'view_visit', 'create_visit', 'update_visit_status',
    'view_patient', 'create_patient', 'edit_patient',
    'view_medical_record', 'create_medical_record', 'edit_medical_record',
    'view_nurse', 'view_procedure'
  ]);

  await assignPermsToRole('kasir', [
    'view_visit', 'create_visit', 'update_visit_status',
    'view_patient', 'create_patient',
    'view_billing', 'create_billing', 'process_payment', 'give_discount',
    'view_financial_report'
  ]);

  await assignPermsToRole('apoteker', [
    'view_visit', 'view_patient',
    'view_medication', 'create_medication', 'edit_medication', 'stock_opname'
  ]);

  await assignPermsToRole('superadmin', Object.keys(permMap));
  await assignPermsToRole('saas_admin', Object.keys(permMap));

  console.log('\nSeed script completed successfully!');
  await client.end();
}

run().catch(console.error);
