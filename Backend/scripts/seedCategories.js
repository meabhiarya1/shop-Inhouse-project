require('dotenv').config();
const axios = require('axios');

// Configurable constants via env or defaults
const DEFAULT_PORTS = (process.env.PORTS || '5000,3000,8000,8080')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean);
const BASE_URL_ENV = process.env.BASE_URL; // e.g., http://localhost:5000
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || '7004106646';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
const TOTAL_CATEGORIES = Number(process.env.CATEGORY_COUNT || 100);
const PREFIX = process.env.CATEGORY_PREFIX || 'Test Category';
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 10);

async function detectBaseUrl() {
  if (BASE_URL_ENV) {
    try {
      const res = await axios.get(`${BASE_URL_ENV.replace(/\/$/, '')}/health`, { timeout: 3000 });
      if (res.data && res.data.success) return BASE_URL_ENV.replace(/\/$/, '');
    } catch (e) {
      // fall through to port scan
    }
  }

  for (const port of DEFAULT_PORTS) {
    const url = `http://localhost:${port}`;
    try {
      const res = await axios.get(`${url}/health`, { timeout: 2000 });
      if (res.data && res.data.success) return url;
    } catch (e) {
      // try next
    }
  }
  throw new Error('Could not detect running API server. Set BASE_URL env or start the backend.');
}

async function loginAndGetToken(baseURL) {
  try {
    const res = await axios.post(`${baseURL}/api/auth/login`, {
      mobileNumber: ADMIN_MOBILE,
      password: ADMIN_PASSWORD,
    }, { timeout: 5000 });

    if (res.data?.success && res.data?.data?.token) {
      return res.data.data.token;
    }
    throw new Error('Login did not return a token.');
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`Login failed: ${msg}. Ensure a user exists (seedUsers.js) and credentials are correct.`);
  }
}

async function getExistingCategoryNames(baseURL, token) {
  try {
    const res = await axios.get(`${baseURL}/api/categories`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });
    const items = res.data?.data || [];
    const set = new Set(items.map(c => String(c.category_name || '').trim().toLowerCase()));
    return set;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`Failed to fetch existing categories: ${msg}`);
  }
}

function generateUniqueNames(count, prefix, existingLowerSet) {
  const names = [];
  let i = 1;
  while (names.length < count) {
    const name = `${prefix} ${String(i).padStart(3, '0')}`.slice(0, 100);
    const lower = name.toLowerCase();
    if (!existingLowerSet.has(lower)) {
      names.push(name);
      existingLowerSet.add(lower);
    }
    i += 1;
    if (i > 10000 && names.length < count) {
      throw new Error('Unable to generate enough unique names.');
    }
  }
  return names;
}

async function createCategory(baseURL, token, category_name) {
  try {
    const res = await axios.post(`${baseURL}/api/categories`, { category_name }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    return { ok: true, id: res.data?.data?.id };
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.message;
    // Treat duplicates as non-fatal
    if (status === 400 && /exists/i.test(msg)) {
      return { ok: false, duplicate: true, error: msg };
    }
    return { ok: false, error: msg, status };
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('➡️  Detecting API server...');
  const baseURL = await detectBaseUrl();
  console.log(`✅ Using API: ${baseURL}`);

  console.log('➡️  Logging in to get token...');
  const token = await loginAndGetToken(baseURL);
  console.log('✅ Authenticated');

  console.log('➡️  Fetching existing categories...');
  const existing = await getExistingCategoryNames(baseURL, token);
  console.log(`ℹ️  Found ${existing.size} existing categories`);

  console.log(`➡️  Generating ${TOTAL_CATEGORIES} unique names with prefix "${PREFIX}"`);
  const toCreate = generateUniqueNames(TOTAL_CATEGORIES, PREFIX, existing);
  console.log(`✅ Prepared ${toCreate.length} new categories`);

  let created = 0, duplicates = 0, failed = 0;
  const results = [];

  for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
    const batch = toCreate.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(async (name) => {
      const r = await createCategory(baseURL, token, name);
      if (r.ok) { created += 1; }
      else if (r.duplicate) { duplicates += 1; }
      else { failed += 1; }
      return { name, ...r };
    }));
    results.push(...batchResults);
    // Gentle pacing to avoid any middleware surprises
    await sleep(150);
    console.log(`Progress: ${Math.min(i + BATCH_SIZE, toCreate.length)}/${toCreate.length} (created: ${created}, failed: ${failed})`);
  }

  console.log('\n==== Summary ====');
  console.log(`Requested: ${toCreate.length}`);
  console.log(`Created:   ${created}`);
  console.log(`Failed:    ${failed}`);
  if (duplicates) console.log(`Duplicates (skipped): ${duplicates}`);

  if (failed > 0) {
    const sampleError = results.find(r => !r.ok && !r.duplicate)?.error;
    if (sampleError) console.log(`Example error: ${sampleError}`);
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
