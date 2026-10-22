import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectClientMetadata } from './metadata';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('device metadata collection', () => {
  it('works without client hints and does not store a fingerprint', async () => {
    localStorage.clear(); sessionStorage.clear();
    const metadata = await collectClientMetadata();
    expect(metadata.viewport).toEqual({ width: window.innerWidth, height: window.innerHeight });
    expect(metadata.language).toBe(navigator.language);
    expect(metadata.clientHints).toBeUndefined();
    expect(Object.keys(metadata)).not.toContain('deviceId');
    expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0);
  });
  it('collects model and real platform version when supplied', async () => {
    const getHighEntropyValues = vi.fn().mockResolvedValue({ model: 'SM-S928B', platformVersion: '15.0.0', fullVersionList: [{ brand: 'Google Chrome', version: '131.0.6778.86' }] });
    vi.stubGlobal('navigator', { language: 'es-UY', maxTouchPoints: 5, userAgentData: {
      platform: 'Android', mobile: true, brands: [{ brand: 'Chromium', version: '131' }], getHighEntropyValues,
    } });
    const metadata = await collectClientMetadata();
    expect(metadata.clientHints).toMatchObject({ platform: 'Android', mobile: true, model: 'SM-S928B', platformVersion: '15.0.0' });
    expect(metadata.touchPoints).toBe(5);
    expect(getHighEntropyValues).toHaveBeenCalledWith(['model', 'platformVersion', 'fullVersionList']);
  });
  it('keeps basic hints if extra data is denied', async () => {
    vi.stubGlobal('navigator', { userAgentData: { platform: 'Windows', mobile: false, getHighEntropyValues: () => Promise.reject(new Error('Denied')) } });
    const metadata = await collectClientMetadata();
    expect(metadata.clientHints).toMatchObject({ platform: 'Windows', mobile: false });
    expect(metadata.clientHints?.model).toBeUndefined();
  });
  it('does not hold up submission if hints never resolve', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', { userAgentData: { platform: 'Android', getHighEntropyValues: () => new Promise(() => {}) } });
    const pending = collectClientMetadata();
    await vi.advanceTimersByTimeAsync(500);
    await expect(pending).resolves.toMatchObject({ clientHints: { platform: 'Android' } });
    expect(vi.getTimerCount()).toBe(0);
  });
  it('discards malformed and excessive data instead of failing the survey', async () => {
    vi.stubGlobal('navigator', { language: '<script>', maxTouchPoints: '5', userAgentData: {
      platform: 'x'.repeat(65), mobile: 'true', brands: [{ brand: 'Chrome', version: 'invalid' }],
      getHighEntropyValues: async () => ({ model: 'x'.repeat(129), platformVersion: 'invalid', fullVersionList: [] }),
    } });
    const metadata = await collectClientMetadata();
    expect(metadata.language).toBeUndefined(); expect(metadata.touchPoints).toBeUndefined();
    expect(metadata.clientHints?.platform).toBeUndefined(); expect(metadata.clientHints?.mobile).toBeUndefined();
    expect(metadata.clientHints?.model).toBeUndefined(); expect(metadata.clientHints?.platformVersion).toBeUndefined();
  });
});
