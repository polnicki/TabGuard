# TabGuard - Tab Deduplicator

Chrome extension that automatically prevents duplicate tabs in your browser.

[🇵🇱 Przeczytaj po polsku](README.pl.md)

## Features

The plugin monitors opened tabs and automatically:
- Detects when you open a tab with the same URL as an existing tab
- Closes the newly opened tab (duplicate)
- Switches to the older, existing tab with the same address
- **Enable/disable the plugin** with a single toggle
- **Exclude specific domains** from duplicate detection
- **Multi-language support** - English and Polish (automatically detected based on browser language)

## How it Works

1. The plugin listens to `onUpdated` events for each tab
2. When a page fully loads (`status === "complete"`)
3. All tabs in the same window are checked
4. If another tab with an identical URL is found (ignoring # fragments)
5. The new tab is closed, and the user is switched to the older tab

## Settings

Open the plugin options to configure:
- **Enable/Disable**: Toggle the plugin on or off
- **Excluded Domains**: Add domains that should NOT have duplicate detection applied

### Example Excluded Domains
- `gmail.com` - exact domain match
- `*.example.com` - wildcard matching for any subdomain
- `mail.google.com` - specific subdomain

## URL Fragment Handling

The plugin compares only the main parts of URLs, ignoring fragment identifiers (`#`). This allows automatic duplicate removal even when tabs differ in page position.

## Multi-Language Support

The plugin is available in:
- **English** (default)
- **Polish**

The interface automatically switches based on your browser language setting. All code comments are in English.

## Exclusions

The plugin does not work for:
- Tabs in incognito mode
- Tabs without a URL
- Tabs on excluded domains (configured in settings)

## Installation

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode" (top right corner)
3. Click "Load unpacked"
4. Select the `TabGuard` folder

## Access Settings

1. Right-click the TabGuard icon in your extensions menu
2. Click "Options"
3. Or navigate to `chrome://extensions/` → TabGuard → "Details" → "Extension options"

## Project Structure

```
TabGuard/
├── manifest.json              Configuration file (Manifest V3)
├── background.js              Service Worker with main logic
├── options.html               Settings page (UI)
├── options.js                 Settings page (logic)
├── _locales/
│   ├── en/messages.json       English translations
│   └── pl/messages.json       Polish translations
├── icon16.png, icon48.png, icon128.png  Extension icons
├── README.md                  English documentation
├── README.pl.md               Polish documentation
└── .gitignore                 Git ignore rules
```

## Icons

The project includes icons in three sizes:
- `icon16.png` - 16x16 px
- `icon48.png` - 48x48 px
- `icon128.png` - 128x128 px

## Development Notes

All code comments are written in English for consistency and maintainability. The user-facing text is fully localized through the Chrome i18n API.

