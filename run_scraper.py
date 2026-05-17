#!/usr/bin/env python3
"""
Interactive CLI for running PropertyPal scraper with multiple search URLs.
"""
import json
import sys
import subprocess
from pathlib import Path
import questionary


def load_searches():
    """Load search configurations from urls.json."""
    urls_file = Path(__file__).parent / "urls.json"

    if not urls_file.exists():
        print(f"Error: {urls_file} not found")
        sys.exit(1)

    try:
        with open(urls_file, 'r') as f:
            config = json.load(f)
            return config.get('searches', [])
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {urls_file}: {e}")
        sys.exit(1)


def run_scrapy(url, use_perplexity, limit=None):
    """Run Scrapy spider with the given URL and perplexity setting.

    ``limit`` caps the number of scraped items per search (handy for dev runs).
    It maps to Scrapy's built-in CLOSESPIDER_ITEMCOUNT setting.
    """
    perplexity_arg = 'true' if use_perplexity else 'false'

    cmd = [
        'scrapy', 'crawl', 'property_spider',
        '-a', f'url={url}',
        '-a', f'use_perplexity={perplexity_arg}'
    ]
    if limit is not None:
        cmd += ['-s', f'CLOSESPIDER_ITEMCOUNT={limit}']

    result = subprocess.run(cmd, cwd=Path(__file__).parent)
    return result.returncode == 0


def parse_limit(argv):
    """Pull --limit N out of argv. Returns int or None. Exits on bad input."""
    for i, a in enumerate(argv):
        if a == '--limit' and i + 1 < len(argv):
            try:
                n = int(argv[i + 1])
            except ValueError:
                print(f"Error: --limit expects an integer, got {argv[i + 1]!r}")
                sys.exit(2)
            if n < 1:
                print("Error: --limit must be >= 1")
                sys.exit(2)
            return n
        if a.startswith('--limit='):
            try:
                n = int(a.split('=', 1)[1])
            except ValueError:
                print(f"Error: --limit expects an integer, got {a!r}")
                sys.exit(2)
            if n < 1:
                print("Error: --limit must be >= 1")
                sys.exit(2)
            return n
    return None


def main():
    """Main interactive CLI."""
    # Load searches
    searches = load_searches()

    if not searches:
        print("Error: No searches found in urls.json")
        sys.exit(1)

    print("\nPropertyPal Scraper - Select Searches to Run")
    print("=" * 45)

    limit = parse_limit(sys.argv)
    if limit is not None:
        print(f"(Item cap per search: {limit})")

    # Check for --all flag
    if '--all' in sys.argv:
        selected_searches = searches
    else:
        # Multi-select menu
        search_choices = [
            questionary.Choice(title=search['name'], value=search)
            for search in searches
        ]

        selected_searches = questionary.checkbox(
            "Select one or more searches (use space to select, enter to confirm):",
            choices=search_choices
        ).ask()

        if not selected_searches:
            print("No searches selected. Exiting.")
            sys.exit(0)

    # Ask about AI ratings
    use_perplexity = questionary.confirm(
        "Enable AI ratings?",
        default=False
    ).ask()

    if use_perplexity is None:  # User cancelled
        print("Cancelled.")
        sys.exit(0)

    # Run selected searches
    total = len(selected_searches)
    print(f"\nRunning {total} search{'es' if total > 1 else ''}...\n")

    successful = 0
    failed = 0

    for i, search in enumerate(selected_searches, 1):
        print(f"[{i}/{total}] Running: {search['name']}")
        print(f"URL: {search['url']}")
        print("-" * 60)

        success = run_scrapy(search['url'], use_perplexity, limit=limit)

        if success:
            successful += 1
            print(f"✓ Completed successfully\n")
        else:
            failed += 1
            print(f"✗ Failed\n")

    # Summary
    print("=" * 60)
    print(f"Results: {successful} successful, {failed} failed")

    if failed == 0:
        print("✓ All searches completed successfully!")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
