// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { App } from '../src/app/App';
import { ResourceIcon } from '../src/components/ResourceIcon';
import catalog from '../src/config/catalog.json';
import { parseCatalog } from '../src/lib/catalog';
import type { ResourceProvider } from '../src/types/resource';
const resources = parseCatalog(catalog).resources;
// JSDOM has no modal top layer; real focus/Escape behavior is covered in Chromium.
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
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
  await user.click(screen.getByRole('button', { name: /^Quantumult X$/ }));
  await user.type(screen.getByRole('searchbox'), 'wise');
  await user.click(
    screen.getAllByRole('button', { name: 'View Wise details' })[0],
  );
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
  await user.click(screen.getByRole('button', { name: 'Close details' }));
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
  await user.click(
    screen.getAllByRole('button', { name: 'View Binance details' })[0],
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
  await screen.findByText('34 resources');
  await user.click(
    screen.getAllByRole('button', { name: 'View Sidestore details' })[0],
  );
  await screen.findByText('Preview unavailable');
  await user.click(screen.getByRole('button', { name: 'Retry preview' }));
  expect(await screen.findByText('Recovered')).toBeVisible();
});

it('copies from a card without fetching a preview, and aborts preview on close', async () => {
  const user = userEvent.setup();
  let signal: AbortSignal | undefined;
  const getResource = vi.fn<ResourceProvider['getResource']>((_id, current) => {
    signal = current;
    return new Promise(() => {});
  });
  render(<App provider={{ ...provider, getResource }} />);
  await screen.findByText('34 resources');
  const card = screen.getByRole('article', {
    name: 'Sidestore · Loon · Plugin',
  });
  await user.click(within(card).getByRole('button', { name: 'Copy URL' }));
  expect(getResource).not.toHaveBeenCalled();
  expect(await navigator.clipboard.readText()).toContain(
    '/loon/plugins/sidestore.plugin',
  );
  await user.click(
    within(card).getAllByRole('button', { name: 'View Sidestore details' })[0],
  );
  expect(signal?.aborted).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Close details' }));
  expect(signal?.aborted).toBe(true);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('falls back to the file icon when an image is missing or no icon is mapped', () => {
  const { container, rerender } = render(
    <ResourceIcon resource={resources[0]} />,
  );
  const image = container.querySelector('img')!;
  expect(image).toHaveAttribute('src', '/icons/sidestore.svg');
  fireEvent.error(image);
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('svg')).not.toBeNull();
  rerender(<ResourceIcon resource={{ ...resources[0], icon: undefined }} />);
  expect(container.querySelector('svg')).not.toBeNull();
});
