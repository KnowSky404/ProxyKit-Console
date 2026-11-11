import { expect, test } from '@playwright/test';
import catalog from '../../src/config/catalog.json' with { type: 'json' };
test('real catalog, filtering, binary handling, theme and private boundary', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('ProxyKit Console');
  await expect(
    page.getByRole('heading', { name: 'Public resources' }),
  ).toBeVisible();
  await expect(page.getByText('27 resources · 34 files')).toBeVisible();
  await page
    .getByRole('button', { name: 'View Sidestore details' })
    .first()
    .click();
  await expect(page.getByLabel('Original file content')).toContainText(
    '#!name',
  );
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.getByRole('button', { name: 'sing-box', exact: true }).click();
  await page
    .getByLabel('Category', { exact: true })
    .selectOption('Binary Rule Set');
  await page.getByRole('searchbox').fill('wise');
  await page.getByRole('button', { name: 'View Wise details' }).first().click();
  await expect(
    page.getByRole('link', { name: /Download SRS/ }),
  ).toHaveAttribute(
    'href',
    'https://raw.githubusercontent.com/KnowSky404/ProxyKit/main/sing-box/rules/wise.srs',
  );
  await expect(page.getByLabel('Original file content')).toHaveCount(0);
  await page.getByLabel('Existing outbound name').fill('My Outbound');
  await expect(page.locator('.config-code')).toContainText(
    '"format": "binary"',
  );
  await expect(page.locator('.config-code')).toContainText(
    '"outbound": "My Outbound"',
  );
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Private', exact: true }).click();
  await expect(page.getByText('No Gateway connected.')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test('text preview is inert and preserves contents; copy produces feedback', async ({
  page,
  context,
  browserName,
}) => {
  // Fixture affects preview only; catalog and all resource URLs remain real.
  await page.route('**/api/resource?**', async (route) => {
    const id = new URL(route.request().url()).searchParams.get('id');
    await route.fulfill({
      json: {
        resource: catalog.resources.find((r) => r.id === id),
        content: '<script>window.UNTRUSTED_EXECUTED = true</script>\n策略\r\n',
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Loon', exact: true }).click();
  await page.getByRole('searchbox').fill('wise');
  await page.getByRole('button', { name: 'View Wise details' }).first().click();
  const preview = page.getByLabel('Original file content');
  await expect(preview).toContainText(
    '<script>window.UNTRUSTED_EXECUTED = true</script>',
  );
  expect(
    await page.evaluate(() => Object.hasOwn(window, 'UNTRUSTED_EXECUTED')),
  ).toBe(false);
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Copy URL', exact: true })
    .click();
  await expect(page.getByText('Copied', { exact: true })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('/loon/rules/wise.list');
  await page.getByLabel(/Policy name/).fill('My Policy');
  await expect(page.locator('.config-code')).toContainText('policy=My Policy');
});

test('card actions work on hover, keyboard and touch; details restore focus', async ({
  page,
  context,
}, testInfo) => {
  const previews: string[] = [];
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('**/api/resource?**', async (route) => {
    const id = new URL(route.request().url()).searchParams.get('id');
    previews.push(id ?? '');
    await route.fulfill({
      json: {
        resource: catalog.resources.find((r) => r.id === id),
        content: 'Test-only preview',
      },
    });
  });
  await page.goto('/');
  const card = page.getByRole('article', {
    name: 'Youtube Enhance · Loon · Plugin',
    exact: true,
  });
  await expect(card).toBeVisible();
  expect(previews).toEqual([]);
  const copy = card.locator('.copy-control');
  if (testInfo.project.name === 'desktop') {
    await expect(copy).toHaveCSS('opacity', '0');
    await card.hover();
    await expect(copy).toHaveCSS('opacity', '1');
  } else {
    await expect(copy).toHaveCSS('opacity', '1');
  }
  await card.getByRole('button', { name: 'Copy URL', exact: true }).click();
  await expect(card.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    '/loon/plugins/youtube-enhance.plugin',
  );
  expect(previews).toEqual([]);
  const open = card.locator('.card-main');
  await open.focus();
  await open.press('Enter');
  await expect(
    page.getByRole('dialog', { name: 'Youtube Enhance' }),
  ).toBeVisible();
  await expect(page.getByLabel('Original file content')).toHaveText(
    'Test-only preview',
  );
  await page.keyboard.press('Tab');
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('dialog') !== null,
    ),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(open).toBeFocused();
  await open.click();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(open).toBeFocused();
  await page.getByRole('button', { name: 'Loon', exact: true }).click();
  await page.getByRole('searchbox').fill('no-matching-resource');
  await expect(
    page.getByText('No resources match your filters.'),
  ).toBeVisible();
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(card).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('sing-box pairs share a card and copy the chosen format on desktop and mobile', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // Real metadata, inert preview fixture; no binary preview content is invented.
  await page.route('**/api/resource?**', async (route) => {
    const id = new URL(route.request().url()).searchParams.get('id');
    const resource = catalog.resources.find((r) => r.id === id);
    await route.fulfill({
      json: {
        resource,
        content: resource?.format === 'srs' ? null : 'Test-only JSON preview',
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'sing-box', exact: true }).click();
  await expect(
    page.getByText('7 resources · 14 files · sing-box'),
  ).toBeVisible();
  await expect(page.locator('.resource-card')).toHaveCount(7);
  const card = page.getByRole('article', {
    name: 'Wise · sing-box · Rule Set',
    exact: true,
  });
  await card.scrollIntoViewIfNeeded();
  const format = card.getByRole('combobox', { name: 'Wise format' });
  await expect(format).toHaveValue('json');
  await card.hover();
  await card.getByRole('button', { name: 'Copy URL', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(
      'https://raw.githubusercontent.com/KnowSky404/ProxyKit/main/sing-box/rules/wise.json',
    );
  await format.selectOption('srs');
  await expect(card.getByRole('status')).toHaveText('');
  await card.getByRole('button', { name: 'Copy URL', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(
      'https://raw.githubusercontent.com/KnowSky404/ProxyKit/main/sing-box/rules/wise.srs',
    );
  await card.locator('.card-main').click();
  await expect(
    page.getByRole('link', { name: /Download SRS/ }),
  ).toHaveAttribute('href', /wise\.srs$/);
  await expect(page.getByLabel('Original file content')).toHaveCount(0);
  await page.getByLabel('Existing outbound name').fill('Test Outbound');
  await expect(page.locator('.config-code')).toContainText(
    '"format": "binary"',
  );
  await page.getByRole('button', { name: 'Close details' }).click();
  await format.selectOption('json');
  await card.locator('.card-main').click();
  await expect(page.getByLabel('Original file content')).toHaveText(
    'Test-only JSON preview',
  );
  await page.getByLabel('Existing outbound name').fill('Test Outbound');
  await expect(page.locator('.config-code')).toContainText(
    '"format": "source"',
  );
  await page.getByRole('button', { name: 'Close details' }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
