import type { ResourceIconId } from '../types/resource';

// Reviewed public service identities; remote plugin metadata never chooses image URLs.
export function resourceIcon(path: string): ResourceIconId | undefined {
  const name = path
    .split('/')
    .at(-1)
    ?.replace(/\.[^.]+$/, '');
  if (path.includes('/scripts/youtube/') || name?.startsWith('youtube'))
    return 'youtube';
  switch (name) {
    case 'sidestore':
    case 'binance':
    case 'bitget-wallet':
    case 'bybit':
    case 'telegram':
    case 'ur':
    case 'wechat':
    case 'wise':
      return name;
    default:
      return undefined;
  }
}
