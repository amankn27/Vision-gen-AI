import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

test('E2E /api/health responds with healthy status and model manifest', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.status);
  assert.equal(data.models.vision, 'gemini-2.5-flash');
  assert.equal(data.models.generation, 'imagen-3.0-generate-002');
  assert.equal(data.maxUploadMb, 20);
});

test('E2E /api/auth manages user session lifecycle', async () => {
  // Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'designer@visiongen.ai', name: 'Lead Designer' }),
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.user.name, 'Lead Designer');

  // Verify current user
  const meRes = await fetch(`${BASE_URL}/api/auth/me`);
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.user.email, 'designer@visiongen.ai');

  // Logout
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
  assert.equal(logoutRes.status, 200);
});

test('E2E /api/settings reads and updates user configuration', async () => {
  const getRes = await fetch(`${BASE_URL}/api/settings`);
  assert.equal(getRes.status, 200);
  const getData = await getRes.json();
  assert.ok(getData.settings);

  const putRes = await fetch(`${BASE_URL}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: 'light', defaultAspectRatio: '16:9' }),
  });
  assert.equal(putRes.status, 200);
  const putData = await putRes.json();
  assert.equal(putData.settings.theme, 'light');
  assert.equal(putData.settings.defaultAspectRatio, '16:9');
});

test('E2E /api/history supports retrieval and deletion', async () => {
  const res = await fetch(`${BASE_URL}/api/history?type=all`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.items));

  // If items exist, test deletion of first item
  if (data.items.length > 0) {
    const targetId = data.items[0].id;
    const deleteRes = await fetch(`${BASE_URL}/api/history/${targetId}`, { method: 'DELETE' });
    assert.equal(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.equal(deleteData.success, true);
  }
});
