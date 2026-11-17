/** Facts used across the site. Keep these in sync with the App Store listing. */
export const SITE = {
  name: 'Re-Hearse',
  url: 'https://letsrehearse.studio',
  description:
    'Scan sheet music and practice it note by note. Re-Hearse names every note, shows which hand plays it, and lights up the keys to press next. Free on iPhone.',
  email: 'letsrehearse.studio@gmail.com',
  appId: '6761712673',
  /** Storefront-neutral link: Apple redirects to the visitor's own country. */
  appStoreUrl: 'https://apps.apple.com/app/id6761712673',
  appStoreReviewUrl: 'https://apps.apple.com/app/id6761712673?action=write-review',
  minimumIOS: '26',
} as const;

export const NAV_LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#try', label: 'Try it' },
  { href: '/#features', label: 'Features' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/support/', label: 'Support', key: 'support' },
] as const;
