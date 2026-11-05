import { expect, test } from '@playwright/test';
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
  await expect(page.getByText('34 resources')).toBeVisible();
  await expect(page.getByLabel('Original file content')).toContainText(
    '#!name',
  );
  await page.getByLabel('Platform', { exact: true }).selectOption('sing-box');
  await page
    .getByLabel('Category', { exact: true })
    .selectOption('Binary Rule Set');
  await page.getByRole('searchbox').fill('wise');
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
        resource: { id },
        content: '<script>window.UNTRUSTED_EXECUTED = true</script>\n策略\r\n',
      },
    });
  });
  await page.goto('/');
  await page.getByLabel('Platform', { exact: true }).selectOption('Loon');
  await page.getByRole('searchbox').fill('wise');
  const preview = page.getByLabel('Original file content');
  await expect(preview).toContainText(
    '<script>window.UNTRUSTED_EXECUTED = true</script>',
  );
  expect(
    await page.evaluate(() => Object.hasOwn(window, 'UNTRUSTED_EXECUTED')),
  ).toBe(false);
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy URL', exact: true }).click();
  await expect(page.getByText('Copied', { exact: true })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('/loon/rules/wise.list');
  await page.getByLabel(/Policy name/).fill('My Policy');
  await expect(page.locator('.config-code')).toContainText('policy=My Policy');
});
