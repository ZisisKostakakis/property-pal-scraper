import json
import csv
import os
from datetime import datetime
from itemadapter import ItemAdapter
from propertypal_scraper.perplexity_rating import PerplexityPropertyRater
from propertypal_scraper.geocoding import GeocodingService
from propertypal_scraper import settings


class ValidationPipeline:
    """Validate required fields and log warnings for incomplete items"""

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)

        # Check required fields
        required_fields = ['property_id', 'url', 'location', 'property_type']
        missing_fields = [field for field in required_fields if not adapter.get(field)]

        if missing_fields:
            spider.logger.warning(
                f"Item missing required fields {missing_fields}: {adapter.get('url', 'unknown')}"
            )

        # Log if price is missing (common issue)
        if not adapter.get('price'):
            spider.logger.warning(f"Item missing price: {adapter.get('url')}")

        # Log if bedrooms is missing
        if not adapter.get('bedrooms'):
            spider.logger.warning(f"Item missing bedrooms: {adapter.get('url')}")

        return item


class JSONPipeline:
    """Export items to JSON file with timestamp"""

    def open_spider(self, spider):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.filename = f'data/raw/properties_{timestamp}.json'

        # Ensure directory exists
        os.makedirs('data/raw', exist_ok=True)

        self.file = open(self.filename, 'w', encoding='utf-8')
        self.file.write('[\n')
        self.first_item = True
        spider.logger.info(f"Opened JSON export file: {self.filename}")

    def close_spider(self, spider):
        self.file.write('\n]')
        self.file.close()
        spider.logger.info(f"Closed JSON export file: {self.filename}")
        spider.logger.info(f"JSON output saved to: {self.filename}")

    def process_item(self, item, spider):
        if not self.first_item:
            self.file.write(',\n')
        self.first_item = False

        # Convert item to dict and serialize with pretty printing
        item_dict = ItemAdapter(item).asdict()

        # Handle datetime serialization
        if 'scraped_at' in item_dict and isinstance(item_dict['scraped_at'], datetime):
            item_dict['scraped_at'] = item_dict['scraped_at'].isoformat()

        # Remove fields not in CSV
        fields_to_remove = ['features', 'room_details', 'directions', 'additional_info']
        for field in fields_to_remove:
            item_dict.pop(field, None)

        line = json.dumps(item_dict, indent=2, ensure_ascii=False)
        self.file.write(line)

        return item


class PerplexityRatingPipeline:
    """Rate properties using Perplexity Housing Agent"""

    def open_spider(self, spider):
        # Check if perplexity rating is enabled via spider argument
        if not getattr(spider, 'use_perplexity', False):
            spider.logger.info("Perplexity rating disabled via command line argument")
            self.rater = None
            self.file = None
            return

        try:
            self.rater = PerplexityPropertyRater()
            spider.logger.info("Perplexity rating pipeline initialized")

            # Create output file for ratings
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            self.filename = f'data/ratings/perplexity_ratings_{timestamp}.json'
            os.makedirs('data/ratings', exist_ok=True)

            self.file = open(self.filename, 'w', encoding='utf-8')
            self.file.write('[\n')
            self.first_item = True
            spider.logger.info(f"Opened Perplexity ratings file: {self.filename}")
        except ValueError as e:
            spider.logger.warning(f"Perplexity rating disabled: {e}")
            self.rater = None
            self.file = None

    def close_spider(self, spider):
        if self.file:
            self.file.write('\n]')
            self.file.close()
            spider.logger.info(f"Perplexity ratings saved to: {self.filename}")

    def process_item(self, item, spider):
        if not self.rater:
            return item

        adapter = ItemAdapter(item)
        property_data = adapter.asdict()

        spider.logger.info(f"Rating property: {property_data.get('url')}")
        rating_result = self.rater.rate_property(property_data)

        # Add rating data to item
        adapter['perplexity_rating'] = rating_result.get('rating_score')
        adapter['perplexity_analysis'] = rating_result.get('rating_text')
        adapter['calculated_monthly_payment'] = rating_result.get('monthly_payment')

        # Write rating to dedicated file
        if self.file:
            if not self.first_item:
                self.file.write(',\n')
            self.first_item = False

            rating_output = {
                'property_id': property_data.get('property_id'),
                'url': property_data.get('url'),
                'location': property_data.get('location'),
                'price': property_data.get('price'),
                'rating_score': rating_result.get('rating_score'),
                'monthly_payment': rating_result.get('monthly_payment'),
                'analysis': rating_result.get('rating_text'),
                'rated_at': datetime.now().isoformat()
            }

            line = json.dumps(rating_output, indent=2, ensure_ascii=False)
            self.file.write(line)

        return item


class DistanceCalculationPipeline:
    """Calculate distance from property location to destination.

    Uses GeocodingService with file-based caching, exponential backoff retry,
    and multi-provider fallback (Nominatim -> Photon -> paid services).

    Configure via environment variables:
    - DESTINATION: Target address for distance calculation
    - GEOCODING_PROVIDERS: Comma-separated provider list (default: nominatim,photon)
    - GEOCODING_MAX_RETRIES: Retry attempts per provider (default: 3)
    - GEOCODING_BASE_DELAY: Base delay for exponential backoff (default: 1.0)
    - GEOCODING_CACHE_FILE: Cache file path (default: data/cache/geocoding_cache.json)
    - GEOCODING_CACHE_TTL_DAYS: Cache TTL in days (default: 30)
    """

    def __init__(self):
        self.geocoding_service = None
        self.destination_coords = None
        self.destination = os.getenv('DESTINATION')
        self.geocoding_disabled = False

    def open_spider(self, spider):
        if not self.destination:
            spider.logger.warning("DESTINATION environment variable not set. Distance calculation disabled.")
            return

        try:
            self.geocoding_service = GeocodingService(
                providers=settings.GEOCODING_PROVIDERS,
                max_retries=settings.GEOCODING_MAX_RETRIES,
                base_delay=settings.GEOCODING_BASE_DELAY,
                cache_file=settings.GEOCODING_CACHE_FILE,
                cache_ttl_days=settings.GEOCODING_CACHE_TTL_DAYS
            )

            spider.logger.info(f"Geocoding destination: {self.destination}")
            self.destination_coords = self.geocoding_service.geocode(self.destination)

            if self.destination_coords:
                spider.logger.info(f"Destination coordinates: {self.destination_coords}")
            else:
                spider.logger.warning(f"Could not geocode destination: {self.destination}. Distance calculation disabled.")
                self.geocoding_disabled = True

        except ValueError as e:
            spider.logger.error(f"No geocoding providers available: {e}")
            self.geocoding_disabled = True
        except Exception as e:
            spider.logger.error(f"Error initializing geocoding service: {e}")
            self.geocoding_disabled = True

    def process_item(self, item, spider):
        if not self.destination_coords or not self.geocoding_service or self.geocoding_disabled:
            return item

        adapter = ItemAdapter(item)
        location = adapter.get('location')

        if not location:
            spider.logger.warning(f"No location found for property {adapter.get('property_id')}")
            return item

        try:
            distance = self.geocoding_service.calculate_distance(location, self.destination_coords)

            if distance is not None:
                adapter['distance_to_destination'] = distance
                spider.logger.debug(f"Calculated distance for {location}: {distance} km")
            else:
                spider.logger.debug(f"Could not geocode property location: {location}")
                adapter['distance_to_destination'] = None

        except Exception as e:
            spider.logger.error(f"Error calculating distance for {location}: {e}")
            adapter['distance_to_destination'] = None

        return item


class CSVPipeline:
    """Export items to CSV file with timestamp"""

    def open_spider(self, spider):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.filename = f'data/processed/properties_{timestamp}.csv'

        # Ensure directory exists
        os.makedirs('data/processed', exist_ok=True)

        self.file = open(self.filename, 'w', newline='', encoding='utf-8')

        # Define CSV columns
        self.fieldnames = [
            'property_id', 'url', 'scraped_at', 'price', 'currency', 'location',
            'property_type', 'bedrooms', 'bathrooms', 'receptions', 'description',
            'calculated_monthly_payment', 'perplexity_rating', 'perplexity_analysis',
            'distance_to_destination', 'listing_status'
        ]

        self.writer = csv.DictWriter(self.file, fieldnames=self.fieldnames, extrasaction='ignore')
        self.writer.writeheader()
        spider.logger.info(f"Opened CSV export file: {self.filename}")

    def close_spider(self, spider):
        self.file.close()
        spider.logger.info(f"Closed CSV export file: {self.filename}")
        spider.logger.info(f"CSV output saved to: {self.filename}")

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        row = {}

        for field in self.fieldnames:
            value = adapter.get(field)

            # Handle list fields - convert to comma-separated string
            if isinstance(value, list):
                value = ', '.join(str(v) for v in value)

            # Handle datetime
            elif isinstance(value, datetime):
                value = value.isoformat()

            # Handle None
            elif value is None:
                value = ''

            row[field] = value

        self.writer.writerow(row)
        return item
