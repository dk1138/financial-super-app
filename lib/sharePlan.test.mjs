import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  preparePlanForSharing,
  encodePlanToHash,
  decodePlanFromHash,
} from './sharePlan.ts';

describe('sharePlan URL codec', () => {
  const sample = {
    mode: 'Couple',
    useRealDollars: true,
    inputs: { p1_age: 35, p1_income: 100000, tax_province: 'ON' },
    properties: [{ name: '123 Maple St Toronto', value: 800000, mortgage: 400000 }],
    dependents: [{ name: 'Emma', dob: '2022-05' }],
    history: [{ id: 'h1', calendarYear: 2025, closingNetWorth: 300000 }],
    constants: { MAX_CPP: 18092 },
  };

  it('strips constants & DataBank history and anonymizes personal names by default', () => {
    const clean = preparePlanForSharing(sample, { anonymize: true });
    assert.equal(clean.constants, undefined);
    assert.equal(clean.history, undefined);
    assert.equal(clean.properties[0].name, 'Primary Residence');
    assert.equal(clean.dependents[0].name, 'Dependent 1');
    assert.equal(clean.inputs.p1_income, 100000);
  });

  it('round-trips plan data cleanly through gzip URL hash encoding', async () => {
    const encoded = await encodePlanToHash(sample, { anonymize: true });
    assert.ok(encoded.startsWith('gz:') || encoded.startsWith('raw:'));

    const decoded = await decodePlanFromHash(`#plan=${encoded}`);
    assert.ok(decoded);
    assert.equal(decoded.mode, 'Couple');
    assert.equal(decoded.inputs.p1_age, 35);
    assert.equal(decoded.inputs.p1_income, 100000);
    assert.equal(decoded.dependents[0].name, 'Dependent 1');
  });

  it('returns null for invalid or malformed hashes', async () => {
    assert.equal(await decodePlanFromHash(''), null);
    assert.equal(await decodePlanFromHash('#plan=gz:not_valid_base64!!!'), null);
  });
});
