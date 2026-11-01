import { test, expect, type Page } from '@playwright/test';

const token = 'e'.repeat(43);
const expiresAt = '2099-01-01T00:00:00Z';
const origin = 'http://127.0.0.1:4328';
const title = 'Encuesta de Evaluación de Gestión Departamental';

function deferred() {
  let release: () => void = () => {};
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}

async function mockApi(page: Page, options: {
  linkGate?: Promise<void>;
  sessionGate?: Promise<void>;
  failFirstLink?: boolean;
  confirmedSession?: boolean;
  sessionError?: { status: number; code: string; error: string };
} = {}) {
  const observed = { configurations: 0, links: 0, sessions: 0, errors: [] as string[], pageErrors: [] as string[] };
  page.on('pageerror', error => observed.pageErrors.push(error.message));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'Content-Type,X-CSRFToken',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path === '/api/csrf') {
      observed.configurations += 1;
      return route.fulfill({ headers, json: { csrf_token: 'compiled-entry-test-csrf', turnstileSiteKey: '' } });
    }
    if (path === '/api/survey/links' && request.method() === 'POST') {
      observed.links += 1;
      await options.linkGate;
      if (options.failFirstLink && observed.links === 1) {
        return route.fulfill({ status: 503, headers, json: { code: 'service_unavailable', error: 'Servicio temporalmente no disponible.' } });
      }
      return route.fulfill({ status: 201, headers, json: { token, expiresAt,
        ...(options.confirmedSession ? { session: { status: 'active', expiresAt } } : {}) } });
    }
    if (path === '/api/survey/session' && request.method() === 'POST') {
      observed.sessions += 1;
      await options.sessionGate;
      if (options.sessionError) {
        const { status, code, error } = options.sessionError;
        return route.fulfill({ status, headers, json: { code, error } });
      }
      return route.fulfill({ headers, json: { status: 'active', expiresAt } });
    }
    observed.errors.push(`${request.method()} ${path}`);
    return route.fulfill({ status: 500, headers, json: { code: 'unexpected_test_request', error: 'Unexpected test request.' } });
  });
  return observed;
}

async function noForm(page: Page) {
  await expect(page.getByRole('heading', { name: title })).toHaveCount(0);
  await expect(page.locator('input[name="consent"]')).toHaveCount(0);
  await expect(page.locator('input[name="adult"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Comenzar encuesta', exact: true })).toHaveCount(0);
}

async function blankTransition(page: Page) {
  await expect(page.locator('#root')).toHaveText('');
  await expect(page.locator('body')).toHaveText('');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('header, footer, main, form, [role="status"], button, img, svg')).toHaveCount(0);
}

async function consentRequired(page: Page) {
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.locator('input[name="consent"]')).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Comenzar encuesta', exact: true })).toBeDisabled();
  await expect(page.locator('input[name="adult"]')).toHaveCount(0);
}

for (const entry of ['/', '/participar']) {
  test(`compiled ${entry} creates one token automatically before revealing consent`, async ({ page }) => {
    const link = deferred();
    const session = deferred();
    const revalidation = deferred();
    const draftRevalidation = deferred();
    const gates = { linkGate: link.promise, sessionGate: session.promise };
    const observed = await mockApi(page, gates);
    try {
      await page.goto(entry, { waitUntil: 'domcontentloaded' });
      await expect.poll(() => observed.links).toBe(1);
      expect(new URL(page.url()).pathname).toBe(entry);
      await blankTransition(page);
      link.release();
      await expect(page).toHaveURL(`${origin}/s/${token}`);
      await expect.poll(() => observed.sessions).toBe(1);
      // A token in the URL is insufficient until the backend validates ownership.
      await blankTransition(page);
      session.release();
      await consentRequired(page);
      expect(observed.links).toBe(1);
      expect(observed.configurations + observed.links + observed.sessions).toBe(4);

      gates.sessionGate = revalidation.promise;
      const initialSessionCalls = observed.sessions;
      await page.reload();
      await expect.poll(() => observed.sessions).toBe(initialSessionCalls + 1);
      await blankTransition(page);
      revalidation.release();
      await consentRequired(page);
      expect(observed.links).toBe(1);
      await page.goto('/participar');
      await expect(page).toHaveURL(`${origin}/s/${token}`);
      await consentRequired(page);
      expect(observed.links).toBe(1);

      await page.locator('input[name="consent"]').locator('..').click();
      await page.getByRole('button', { name: 'Comenzar encuesta', exact: true }).click();
      await expect(page.getByText('¿Tenés 18 años o más?', { exact: true })).toBeVisible();
      // A saved draft must not flash questions or the surrounding layout while
      // the server is validating its existing personal link after a reload.
      gates.sessionGate = draftRevalidation.promise;
      const draftSessionCalls = observed.sessions;
      await page.reload();
      await expect.poll(() => observed.sessions).toBe(draftSessionCalls + 1);
      await blankTransition(page);
      draftRevalidation.release();
      await expect(page.getByText('¿Tenés 18 años o más?', { exact: true })).toBeVisible();
      expect(observed.links).toBe(1);
      expect(observed.errors).toEqual([]);
      expect(observed.pageErrors).toEqual([]);
    } finally {
      link.release();
      session.release();
      revalidation.release();
      draftRevalidation.release();
    }
  });
}

for (const entry of ['/', '/participar']) {
  test(`compiled fast entry ${entry} uses two requests and validates again after reload`, async ({ page }) => {
    const link = deferred();
    const revalidation = deferred();
    const options = { confirmedSession: true, linkGate: link.promise, sessionGate: revalidation.promise };
    const observed = await mockApi(page, options);
    try {
      await page.goto(entry, { waitUntil: 'domcontentloaded' });
      await expect.poll(() => observed.links).toBe(1);
      await blankTransition(page);
      expect(observed.configurations).toBe(1);
      link.release();
      await expect(page).toHaveURL(`${origin}/s/${token}`);
      // The link response already confirms the server received its browser
      // cookie: no additional validation request may delay the first screen.
      await consentRequired(page);
      expect(observed.links).toBe(1);
      expect(observed.sessions).toBe(0);
      expect(observed.configurations + observed.links + observed.sessions).toBe(2);

      await page.reload();
      await expect.poll(() => observed.sessions).toBe(1);
      await blankTransition(page);
      revalidation.release();
      await consentRequired(page);
      expect(observed.links).toBe(1);
      expect(observed.configurations + observed.links + observed.sessions).toBe(4);
      expect(observed.errors).toEqual([]);
      expect(observed.pageErrors).toEqual([]);
    } finally {
      link.release();
      revalidation.release();
    }
  });
}

test('compiled entry fails closed and only retries creation after explicit action', async ({ page }) => {
  const observed = await mockApi(page, { failFirstLink: true });
  await page.goto('/');
  await expect(page.getByRole('alert')).toHaveText('No pudimos conectar con la encuesta. Volvé a intentar.');
  await noForm(page);
  expect(new URL(page.url()).pathname).toBe('/');
  expect(observed.links).toBe(1);
  await page.evaluate(() => {
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForLoadState('networkidle');
  expect(observed.links).toBe(1);
  await page.getByRole('button', { name: 'Volver a intentar', exact: true }).click();
  await expect(page).toHaveURL(`${origin}/s/${token}`);
  await consentRequired(page);
  expect(observed.links).toBe(2);
  expect(observed.errors).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});

for (const error of [
  { status: 404, code: 'link_invalid', error: 'El enlace de la encuesta no es válido.' },
  { status: 403, code: 'link_bound', error: 'Este enlace está vinculado al navegador que inició la encuesta.' },
  { status: 410, code: 'link_expired', error: 'El enlace venció. Volvé a la campaña.' },
  { status: 409, code: 'link_used', error: 'Este enlace ya fue utilizado y no admite otra respuesta.' },
]) {
  test(`compiled ${error.code} token never reveals the form or creates a replacement`, async ({ page }) => {
    const observed = await mockApi(page, { sessionError: error });
    await page.goto(`/s/${token}`);
    const publicMessage = error.code === 'link_used' ? 'Esta encuesta ya fue respondida.' : 'Esta encuesta no está disponible.';
    await expect(page.getByRole('alert')).toHaveText(publicMessage);
    await noForm(page);
    await expect(page.getByRole('button', { name: 'Volver a intentar', exact: true })).toHaveCount(0);
    expect(observed.links).toBe(0);
    await page.reload();
    await expect(page.getByRole('alert')).toHaveText(publicMessage);
    await noForm(page);
    expect(observed.links).toBe(0);
    expect(observed.errors).toEqual([]);
    expect(observed.pageErrors).toEqual([]);
  });
}
