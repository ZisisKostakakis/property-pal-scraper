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


def run_scrapy(url, use_perplexity):
    """Run Scrapy spider with the given URL and perplexity setting."""
    perplexity_arg = 'true' if use_perplexity else 'false'

    cmd = [
        'scrapy', 'crawl', 'property_spider',
        '-a', f'url={url}',
        '-a', f'use_perplexity={perplexity_arg}'
    ]

    result = subprocess.run(cmd, cwd=Path(__file__).parent)
    return result.returncode == 0


def main():
    """Main interactive CLI."""
    # Load searches
    searches = load_searches()

    if not searches:
        print("Error: No searches found in urls.json")
        sys.exit(1)

    print("\nPropertyPal Scraper - Select Searches to Run")
    print("=" * 45)

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

        success = run_scrapy(search['url'], use_perplexity)

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
