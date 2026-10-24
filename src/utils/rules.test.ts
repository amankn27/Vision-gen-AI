import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageFile,
  formatBytes,
  formatTimestamp,
  truncatePrompt,
  filterHistoryItems,
  getPresetByRatio,
  GenericItem,
} from './rules';

test('validateImageFile accepts valid JPEG, PNG, and WEBP within size limit', () => {
  const validJpeg = { name: 'photo.jpg', type: 'image/jpeg', size: 1024 * 1024 };
  const validPng = { name: 'graphic.png', type: 'image/png', size: 5 * 1024 * 1024 };
  const validWebp = { name: 'art.webp', type: 'image/webp', size: 500 * 1024 };

  assert.equal(validateImageFile(validJpeg).valid, true);
  assert.equal(validateImageFile(validPng).valid, true);
  assert.equal(validateImageFile(validWebp).valid, true);
});

test('validateImageFile rejects unsupported formats', () => {
  const invalidPdf = { name: 'doc.pdf', type: 'application/pdf', size: 1024 };
  const invalidSvg = { name: 'icon.svg', type: 'image/svg+xml', size: 2048 };

  const resPdf = validateImageFile(invalidPdf);
  assert.equal(resPdf.valid, false);
  assert.match(resPdf.error || '', /unsupported format/i);

  const resSvg = validateImageFile(invalidSvg);
  assert.equal(resSvg.valid, false);
});

test('validateImageFile rejects files over 20 MB or zero bytes', () => {
  const oversized = { name: 'huge.jpg', type: 'image/jpeg', size: 25 * 1024 * 1024 };
  const empty = { name: 'empty.png', type: 'image/png', size: 0 };

  const resOversized = validateImageFile(oversized);
  assert.equal(resOversized.valid, false);
  assert.match(resOversized.error || '', /too large/i);

  const resEmpty = validateImageFile(empty);
  assert.equal(resEmpty.valid, false);
  assert.match(resEmpty.error || '', /empty/i);
});

test('formatBytes formats file sizes with appropriate units', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1.5 * 1024 * 1024), '1.5 MB');
  assert.equal(formatBytes(20 * 1024 * 1024), '20 MB');
});

test('truncatePrompt trims cleanly with ellipsis', () => {
  const shortText = 'A mountain scene at twilight';
  assert.equal(truncatePrompt(shortText, 50), shortText);

  const longText = 'A breathtaking panoramic hyper-realistic render of an ancient cyberpunk city surrounded by neon waterfalls';
  const truncated = truncatePrompt(longText, 30);
  assert.equal(truncated.endsWith('...'), true);
  assert.ok(truncated.length <= 33);
});

test('getPresetByRatio returns correct preset or defaults to 1:1', () => {
  assert.equal(getPresetByRatio('16:9').ratio, '16:9');
  assert.equal(getPresetByRatio('9:16').ratio, '9:16');
  assert.equal(getPresetByRatio('unknown').ratio, '1:1');
});

test('filterHistoryItems handles category filters, search query, and sorting', () => {
  const sampleItems: GenericItem[] = [
    { id: '1', type: 'analysis', title: 'Car inspection', createdAt: '2026-10-20T10:00:00Z' },
    { id: '2', type: 'generation', prompt: 'Cyberpunk street', createdAt: '2026-10-21T10:00:00Z' },
    { id: '3', type: 'transform', prompt: 'Cyberpunk street oil painting', createdAt: '2026-10-22T10:00:00Z' },
  ];

  // Filter by category
  const generationsOnly = filterHistoryItems(sampleItems, 'generation');
  assert.equal(generationsOnly.length, 1);
  assert.equal(generationsOnly[0].id, '2');

  // Search by query
  const searchResults = filterHistoryItems(sampleItems, 'all', 'cyberpunk');
  assert.equal(searchResults.length, 2);

  // Sorting
  const sortedNewest = filterHistoryItems(sampleItems, 'all', '', 'newest');
  assert.equal(sortedNewest[0].id, '3');

  const sortedOldest = filterHistoryItems(sampleItems, 'all', '', 'oldest');
  assert.equal(sortedOldest[0].id, '1');
});
