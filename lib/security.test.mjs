import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from './rateLimit.ts';
import { sanitizeTooltipHtml } from './sanitizeHtml.ts';

describe('checkRateLimit', () => {
  it('allows requests up to the limit and blocks subsequent requests within the window', () => {
    const key = `test-rate-${Date.now()}`;
    assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);
    assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);

    const blocked = checkRateLimit(key, 2, 60_000);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSec >= 1);
  });
});

describe('sanitizeTooltipHtml', () => {
  it('preserves safe formatting tags and strips scripts, iframes, and event handlers', () => {
    const dirty =
      '<b>Tip:</b> Use <span class="text-info" onclick="alert(1)">RRSP</span><br><script>alert("xss")</script><img src=x onerror=alert(2)><iframe src="https://evil.test"></iframe>';
    const clean = sanitizeTooltipHtml(dirty);

    assert.ok(clean.includes('<b>Tip:</b>'));
    assert.ok(clean.includes('<span class="text-info">RRSP</span>'));
    assert.ok(clean.includes('<br />'));
    assert.ok(!clean.includes('<script'));
    assert.ok(!clean.includes('onclick'));
    assert.ok(!clean.includes('onerror'));
    assert.ok(!clean.includes('<iframe'));
    assert.ok(!clean.includes('<img'));
  });
});
