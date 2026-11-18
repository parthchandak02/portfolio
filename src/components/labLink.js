// How a Lab tile names its outbound link: GitHub repos say "View on GitHub",
// everything else says "Open live site" (see LabShowcase).

export const isGitHub = (url) => {
  try {
    const { hostname } = new URL(url);
    return hostname === 'github.com' || hostname.endsWith('.github.com');
  } catch {
    return false;
  }
};

export const openLabel = (url) =>
  isGitHub(url) ? 'View on GitHub' : 'Open live site';
