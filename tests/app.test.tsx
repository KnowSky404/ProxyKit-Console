// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { App } from '../src/app/App';
import catalog from '../src/config/catalog.json';
import { parseCatalog } from '../src/lib/catalog';
import type { ResourceProvider } from '../src/types/resource';
const resources = parseCatalog(catalog).resources;
const provider: ResourceProvider = {
  id: 'fixture',
  name: 'Test only provider',
  listResources: vi.fn(async () => resources),
  getResource: vi.fn(async (id) => ({
    resource: resources.find((r) => r.id === id)!,
    content: '<script>test only fixture; never execute</script>\n策略\r\n',
  })),
};
afterEach(cleanup);
it('searches, filters, previews, copies and generates user-selected policy', async () => {
  const user = userEvent.setup();
  render(<App provider={provider} />);
  await screen.findByText('34 resources');
  await user.selectOptions(screen.getByLabelText('Platform'), 'Quantumult X');
  await user.type(screen.getByRole('searchbox'), 'wise');
  const details = screen.getByRole('article', { name: 'Resource details' });
  expect(
    await within(details).findByText('Quantumult X · Filter · .list'),
  ).toBeVisible();
  expect(
    await screen.findByLabelText('Original file content'),
  ).toHaveTextContent('<script>test only fixture; never execute</script>');
  await user.click(within(details).getByRole('button', { name: 'Copy URL' }));
  expect(await navigator.clipboard.readText()).toContain(
    '/quantumultx/filters/wise.list',
  );
  expect(within(details).getByText('Copied')).toBeVisible();
  await user.type(screen.getByLabelText(/Policy name/), 'My Policy');
  expect(details).toHaveTextContent('force-policy=My Policy');
  await user.click(screen.getByRole('button', { name: 'Copy configuration' }));
  expect(await navigator.clipboard.readText()).toContain('[filter_remote]');
  await user.selectOptions(screen.getByLabelText('Category'), 'Rewrite');
  expect(screen.getByText('No resources match your filters.')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Private' }));
  expect(screen.getByText('No Gateway connected.')).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: /Switch to dark theme/ }),
  );
  expect(document.documentElement.dataset.theme).toBe('dark');
});
it('shows binary download without a text preview', async () => {
  const user = userEvent.setup();
  render(<App provider={provider} />);
  await screen.findByText('34 resources');
  await user.selectOptions(
    screen.getByLabelText('Category'),
    'Binary Rule Set',
  );
  expect(
    await screen.findByRole('link', { name: /Download SRS/ }),
  ).toHaveAttribute('href', expect.stringContaining('.srs'));
  expect(
    screen.queryByLabelText('Original file content'),
  ).not.toBeInTheDocument();
});
it('recovers from catalog failure and handles an empty catalog', async () => {
  const user = userEvent.setup();
  const failing = {
    ...provider,
    listResources: vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([]),
  };
  render(<App provider={failing} />);
  await screen.findByText('Could not load the public catalog.');
  await user.click(screen.getByRole('button', { name: 'Retry catalog' }));
  expect(
    await screen.findByText('No resources match your filters.'),
  ).toBeVisible();
});
it('reports preview failure and retries', async () => {
  const user = userEvent.setup();
  render(
    <App
      provider={{
        ...provider,
        getResource: vi
          .fn()
          .mockRejectedValueOnce(new Error('Preview unavailable'))
          .mockResolvedValueOnce({
            resource: resources[0],
            content: 'Recovered',
          }),
      }}
    />,
  );
  await screen.findByText('Preview unavailable');
  await user.click(screen.getByRole('button', { name: 'Retry preview' }));
  expect(await screen.findByText('Recovered')).toBeVisible();
});
