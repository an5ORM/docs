#!/usr/bin/env python3
"""Check that every internal link in the built site resolves to a real file.

Run against the output of `jekyll build`, not the sources, so it sees the URLs
the site actually serves.
"""
import pathlib
import re
import sys
import urllib.parse

BASE = "/docs"  # keep in sync with baseurl in docs/_config.yml
SKIP_PREFIXES = ("http://", "https://", "mailto:", "tel:", "#", "data:", "//")


def build_url_map(site: pathlib.Path) -> set:
    """Every URL the site serves: a page is reachable by its directory or by
    its own .html, and a static file by its path. Keys carry the baseurl, which
    is how the site links to itself."""
    urls = set()
    for path in site.rglob("*"):
        if not path.is_file():
            continue
        rel = "/" + path.relative_to(site).as_posix()
        if path.suffix == ".html":
            stem = rel[: -len(".html")]
            urls.add(BASE + stem + "/")
            urls.add(BASE + rel)
            if stem.endswith("/index"):
                urls.add(BASE + stem[: -len("index")])
        else:
            urls.add(BASE + rel)
    urls.add(BASE + "/")
    return urls


def main() -> int:
    site = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/opencode/site").resolve()
    known = build_url_map(site)

    broken: dict[str, set] = {}
    checked = 0

    for page in sorted(site.rglob("*.html")):
        here = "/" + page.relative_to(site).as_posix()
        for match in re.finditer(r'(?:href|src)="([^"]+)"', page.read_text()):
            href = match.group(1)
            if href.startswith(SKIP_PREFIXES):
                continue

            raw = urllib.parse.urlparse(href).path
            if not raw:
                continue
            checked += 1

            target = raw if raw.startswith(BASE) else urllib.parse.urljoin(here, raw)
            target = target.split("#")[0].split("?")[0]
            # A page is served at its directory; a file keeps its extension.
            if not target.endswith("/") and "." not in target.rsplit("/", 1)[-1]:
                target += "/"

            if target not in known:
                broken.setdefault(here, set()).add(href)

    print(f"internal links checked: {checked}")
    if not broken:
        print("  no broken links")
        return 0

    print(f"  broken in {len(broken)} page(s):")
    for page, hrefs in sorted(broken.items()):
        for href in sorted(hrefs):
            print(f"    {page} -> {href}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
