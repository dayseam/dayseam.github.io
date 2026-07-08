// Canonical download surfaces for the marketing site.
//
// macOS ships through the Mac App Store (bundle id `dev.dayseam.mas`).
// Windows ships as a direct NSIS installer hosted on this site under
// `/downloads/` — the product repo's `publish-windows-download.yml`
// workflow copies each release artefact here and refreshes the stable
// alias filenames below.

export const SOFTWARE_VERSION = "0.16.2";

export const MAC_APP_STORE_URL =
  "https://apps.apple.com/us/app/dayseam/id6766103608?mt=12";

/** Stable marketing URL — overwritten on each Windows publish. */
export const WINDOWS_SETUP_PATH = "/downloads/Dayseam-x64-setup.exe";

export const WINDOWS_SETUP_SHA256_PATH =
  "/downloads/Dayseam-x64-setup.exe.sha256";

export const WINDOWS_REQUIREMENTS =
  "Windows 10 version 22H2 or later (64-bit). WebView2 is installed automatically when missing.";

export const MAC_REQUIREMENTS =
  "macOS 12 or later. Apple Silicon or Intel — same App Store listing.";

export function windowsSetupUrl(siteOrigin: string): string {
  return new URL(WINDOWS_SETUP_PATH, siteOrigin).toString();
}

export function windowsSetupSha256Url(siteOrigin: string): string {
  return new URL(WINDOWS_SETUP_SHA256_PATH, siteOrigin).toString();
}
