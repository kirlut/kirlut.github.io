# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Personal technical blog (www.lutkir.dev) built with Jekyll and the Minimal Mistakes remote theme, hosted on GitHub Pages.

## Development Commands

```bash
# Install dependencies
bundle install

# Serve locally with live reload
bundle exec jekyll serve --livereload

# Clean rebuild (if dependencies are stale)
rm -f Gemfile.lock && rm -rf .bundle vendor/bundle && bundle install
```

Note: `_config.yml` changes require restarting the server.

## Architecture

- **Theme**: Minimal Mistakes via `remote_theme: mmistakes/minimal-mistakes` (not installed locally — layouts, includes, and assets come from the remote theme)
- **Posts**: `_posts/` — Markdown files with YYYY-MM-DD prefix, categorized under "Blog", using `single` layout with author profile, TOC, and sharing enabled by default (see `_config.yml` defaults)
- **Pages**: `_pages/` — static pages (about, 404, archive pages)
- **Navigation**: `_data/navigation.yml` — top nav links
- **Images**: `assets/images/` — bio photo, OG images per post (in `assets/images/og/`)
- **Generated site**: `_site/` — build output (gitignored implicitly by GitHub Pages)

## Post Front Matter Pattern

Posts use this front matter structure:

```yaml
---
title: "Post Title"
categories:
- Blog
toc: true
toc_label: "On this page"
toc_icon: "list"
toc_sticky: true
header:
  og_image: /assets/images/og/<filename>.jpg
tags:
- Tag Name
---
```

## Key Config Details

- Permalink structure: `/:categories/:title/`
- Pagination: 10 posts per page
- Plugins: jekyll-paginate, jekyll-sitemap, jekyll-gist, jekyll-feed, jemoji, jekyll-include-cache
