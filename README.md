![Publish Status](https://github.com/ether/ep_mediawiki/workflows/Node.js%20Package/badge.svg) [![Backend Tests Status](https://github.com/ether/ep_mediawiki/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/ether/ep_mediawiki/actions/workflows/test-and-release.yml)

MediaWiki export in Etherpad
============================

Use the normal editbar buttons to add MediaWiki style markdown.
Export as MediaWiki.

To enable MediaWiki view click Settings -> MediaWiki

Setting as default
==================
Paste the below into your settings.

"ep_MediaWiki_default": true,

Optional: hide unsupported toolbar buttons
==========================================
By default, ep_mediawiki leaves extra toolbar plugins alone so site admins can
decide which controls they want to support. If you want MediaWiki mode to hide
unsupported toolbar buttons, enable this in your Etherpad settings:

```json
{
  "ep_mediawiki": {
    "hideUnsupportedToolbarButtons": true,
    "unsupportedToolbarSelectors": [
      ".ep_checklists"
    ]
  }
}
```

When `hideUnsupportedToolbarButtons` is enabled, ep_mediawiki automatically
hides the alignment buttons from `ep_align` while MediaWiki mode is on. Add any
extra selectors your checklist plugin uses to `unsupportedToolbarSelectors`.

todo
====
* Support all styles fully
* append .mw (or something) to MediaWiki exports
* Create MediaWiki icon for export menu

Contact me to sponsor dev.

## Installation

Install from the Etherpad admin UI (**Admin → Manage Plugins**,
search for `ep_mediawiki` and click *Install*), or from the Etherpad
root directory:

```sh
pnpm run plugins install ep_mediawiki
```

> ⚠️ Don't run `npm i` / `npm install` yourself from the Etherpad
> source tree — Etherpad tracks installed plugins through its own
> plugin-manager, and hand-editing `package.json` can leave the
> server unable to start.

After installing, restart Etherpad.
