import { test, expect, type Locator, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const output = fileURLToPath(new URL('../artifacts/visual-controls/', import.meta.url));
const token = 'v'.repeat(43);
const runId = 's'.repeat(43);
const expiresAt = '2099-01-01T00:00:00Z';
const origin = 'http://127.0.0.1:4328';

async function mockApi(page: Page) {
  const submissions: unknown[] = [];
  const publicCalls: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'OPTIONS' && path.startsWith('/api/survey/')) publicCalls.push(path);
    const headers = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'Content-Type,X-CSRFToken',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    let data: unknown;
    let status = 200;
    if (path === '/api/csrf') data = { csrf_token: 'local-visual-test-token', turnstileSiteKey: '' };
    else if (path === '/api/survey/links') { data = { token, expiresAt }; status = 201; }
    else if (path === '/api/survey/session') data = { status: 'active', expiresAt };
    else if (path === '/api/simulation/session') data = { status: 'active', runId, expiresAt, username: 'Prueba visual local' };
    else if (path.endsWith('/challenge')) data = { challengeId: '123e4567-e89b-42d3-a456-426614174000', question: '¿Cuánto es 7 + 8?', expiresAt };
    else if (path === '/api/survey/responses') {
      submissions.push(request.postDataJSON()); data = { status: 'completed', receiptId: 'local-visual-receipt' }; status = 201;
    } else {
      errors.push(`Unexpected API request ${request.method()} ${path}`);
      return route.fulfill({ status: 500, headers, json: { error: 'Unexpected local test request' } });
    }
    return route.fulfill({ status, headers, json: data });
  });
  return { submissions, publicCalls, errors };
}

const radio = (page: Page, name: string, value: string) => page.locator(`input[type="radio"][name="${name}"][value="${value}"]`);
async function choose(page: Page, name: string, value: string) {
  const input = radio(page, name, value);
  await input.locator('..').click();
  await expect(input).toBeChecked();
  await expectRadioMarker(input);
}
async function next(page: Page) { await page.getByRole('button', { name: 'Siguiente', exact: true }).click(); }
async function back(page: Page) { await page.getByRole('button', { name: 'Atrás', exact: true }).click(); }
async function expectRadioMarker(input: Locator, selected = true) {
  const marker = input.locator('..').locator('.survey-radio');
  await expect(marker).toBeVisible();
  await expect.poll(async () => marker.evaluate(element => getComputedStyle(element, '::after').opacity)).toBe(selected ? '1' : '0');
  if (selected) await expect.poll(async () => marker.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgb(255, 255, 255)');
}
async function expectCheckboxMarker(input: Locator, selected = true) {
  const marker = input.locator('..').locator('.survey-check-svg');
  await expect(marker).toBeVisible();
  await expect.poll(async () => marker.evaluate(element => getComputedStyle(element).opacity)).toBe(selected ? '1' : '0');
}
async function toAreas(page: Page, mode: 'public' | 'simulation' = 'public') {
  await page.goto(mode === 'simulation' ? '/simular' : '/participar');
  const consent = page.locator('input[name="consent"]');
  await expect(page.getByRole('button', { name: 'Comenzar encuesta', exact: true })).toBeDisabled();
  await consent.focus();
  await page.keyboard.press('Space');
  await expect(consent).toBeChecked();
  await expectCheckboxMarker(consent);
  await page.getByRole('button', { name: 'Comenzar encuesta', exact: true }).click();
  await choose(page, 'adult', 'si'); await next(page);
  await choose(page, 'lavallejaResident', 'si'); await next(page);
  await choose(page, 'locality', 'minas'); await next(page);
  await choose(page, 'gender', 'ns_nc'); await choose(page, 'ageRange', '35_44'); await next(page);
  await choose(page, 'voted2025', 'pnr'); await next(page);
  await choose(page, 'generalEvaluation', 'buena');
  await choose(page, 'generalSatisfaction', 'conforme');
  await choose(page, 'managementEvolution', 'aprox_igual'); await next(page);
  await expect(page.getByRole('heading', { name: 'Evaluación por áreas', exact: true })).toBeVisible();
}
function visibleMatrixRadios(page: Page, value: string) {
  return page.locator('label:visible').filter({ has: page.locator(`input[type="radio"][value="${value}"]`) }).locator('input');
}
async function fillMatrix(page: Page, count: number) {
  const choices = visibleMatrixRadios(page, 'ns_nc');
  await expect(choices).toHaveCount(count);
  for (let index = 0; index < count; index++) {
    const input = choices.nth(index);
    await input.locator('..').click();
    await expect(input).toBeChecked();
    await expectRadioMarker(input);
  }
}

test('compiled desktop matrix visibly marks selected answers and survives responsive switches and back navigation', async ({ page }) => {
  const observed = await mockApi(page);
  await toAreas(page);
  const first = visibleMatrixRadios(page, 'ns_nc').first();
  await first.locator('..').click();
  await expect(first).toBeChecked();
  // This is the regression: checked values alone did not expose an empty desktop marker.
  await expectRadioMarker(first);
  await fillMatrix(page, 8);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectRadioMarker(visibleMatrixRadios(page, 'ns_nc').first());
  const mobileChange = visibleMatrixRadios(page, 'buena').first();
  await mobileChange.focus();
  await page.keyboard.press('Space');
  await expect(mobileChange).toBeChecked();
  await expectRadioMarker(mobileChange);
  await page.keyboard.press('ArrowLeft');
  await expect(visibleMatrixRadios(page, 'muy_buena').first()).toBeChecked();
  await expectRadioMarker(visibleMatrixRadios(page, 'muy_buena').first());
  await page.keyboard.press('ArrowRight');
  await expect(mobileChange).toBeChecked();
  await expectRadioMarker(mobileChange);
  await expectRadioMarker(visibleMatrixRadios(page, 'ns_nc').first(), false);
  await page.setViewportSize({ width: 1280, height: 1000 });
  await expectRadioMarker(visibleMatrixRadios(page, 'buena').first());
  await expectRadioMarker(visibleMatrixRadios(page, 'ns_nc').first(), false);
  mkdirSync(output, { recursive: true });
  await page.screenshot({ path: output + '/desktop-matrix-selections.png', fullPage: true });
  await next(page);
  await fillMatrix(page, 10);
  await back(page);
  await expectRadioMarker(visibleMatrixRadios(page, 'buena').first());
  await next(page);
  for (let index = 0; index < 10; index++) await expectRadioMarker(visibleMatrixRadios(page, 'ns_nc').nth(index));
  await next(page);
  const concern = page.locator('input[type="checkbox"][value="costo_vida"]');
  await concern.focus(); await page.keyboard.press('Space');
  await expect(concern).toBeChecked(); await expectCheckboxMarker(concern);
  await next(page); await back(page);
  await expect(concern).toBeChecked(); await expectCheckboxMarker(concern);
  await concern.focus(); await page.keyboard.press('Space');
  await expect(concern).not.toBeChecked(); await expectCheckboxMarker(concern, false);
  await next(page);
  await expect(page.getByRole('heading', { name: 'Principales preocupaciones', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(observed.submissions).toEqual([]);
  expect(observed.errors).toEqual([]);
  mkdirSync(output, { recursive: true });
  await page.screenshot({ path: output + '/desktop-selections.png', fullPage: true });
});

test('compiled simulation uses the same visible controls on mobile without public submissions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const observed = await mockApi(page);
  await toAreas(page, 'simulation');
  await fillMatrix(page, 8);
  mkdirSync(output, { recursive: true });
  await page.screenshot({ path: output + '/mobile-matrix-selections.png', fullPage: true });
  await next(page); await fillMatrix(page, 10); await next(page);
  for (const value of ['costo_vida', 'falta_empleo', 'seguridad']) {
    const input = page.locator(`input[type="checkbox"][value="${value}"]`);
    await input.locator('..').click(); await expect(input).toBeChecked(); await expectCheckboxMarker(input);
  }
  await expect(page.locator('input[type="checkbox"][value="vivienda"]')).toBeDisabled();
  const exclusive = page.locator('input[type="checkbox"][value="ns_nc"]');
  await exclusive.locator('..').click();
  await expect(exclusive).toBeChecked(); await expectCheckboxMarker(exclusive);
  await expect(page.locator('input[type="checkbox"]:checked')).toHaveCount(1);
  await next(page); await back(page);
  await expect(exclusive).toBeChecked(); await expectCheckboxMarker(exclusive);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(observed.submissions).toEqual([]);
  expect(observed.publicCalls).toEqual([]);
  expect(observed.errors).toEqual([]);
  mkdirSync(output, { recursive: true });
  await page.screenshot({ path: output + '/mobile-selections.png', fullPage: true });
});
