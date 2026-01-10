import json
import re

def extract_rating_from_analysis(analysis_text):
    """Extract rating score from analysis text."""
    # Look for patterns like "Rating: X/10" or "**Rating: X/10**"
    patterns = [
        r'\*\*Rating:\s*([0-9]+(?:\.[0-9]+)?)/10\*\*',
        r'Rating:\s*([0-9]+(?:\.[0-9]+)?)/10'
    ]

    for pattern in patterns:
        match = re.search(pattern, analysis_text)
        if match:
            return float(match.group(1))

    return None

def fix_ratings(json_file_path):
    """Fix missing rating_score values by extracting from analysis text."""
    # Read the JSON file
    with open(json_file_path, 'r') as f:
        data = json.load(f)

    # Track how many ratings we fix
    fixed_count = 0

    # Process each property
    for property_data in data:
        if property_data.get('rating_score') is None:
            rating = extract_rating_from_analysis(property_data.get('analysis', ''))
            if rating is not None:
                property_data['rating_score'] = rating
                fixed_count += 1
                print(f"Fixed property {property_data['property_id']}: rating = {rating}")
            else:
                print(f"Could not extract rating for property {property_data['property_id']}")

    # Write back to file
    with open(json_file_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"\nFixed {fixed_count} missing rating scores out of {len(data)} total properties")

if __name__ == "__main__":
    json_file = "/Users/zisiskostakakis/Github/property-pal-scraper/data/ratings/perplexity_ratings_20260107_180312.json"
    fix_ratings(json_file)
