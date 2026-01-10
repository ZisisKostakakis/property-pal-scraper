import json
import csv
import os
from datetime import datetime
from itemadapter import ItemAdapter
from propertypal_scraper.perplexity_rating import PerplexityPropertyRater
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import time


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
    """Calculate distance from property location to destination

    WARNING: This pipeline uses OpenStreetMap's Nominatim geocoding service.
    Nominatim has strict usage policies and may block requests for:
    - Bulk processing (more than ~1 request per second)
    - Missing or inappropriate user agent strings
    - Commercial use without permission

    For production or bulk processing, consider using commercial geocoding services:
    - Google Maps Geocoding API
    - Mapbox Geocoding API
    - Here Maps Geocoding API
    - OpenCage Geocoding API

    To disable geocoding, remove the DESTINATION environment variable.
    """

    def __init__(self):
        self.geolocator = None
        self.destination_coords = None
        self.destination = os.getenv('DESTINATION')
        self.geocoding_disabled = False

    def open_spider(self, spider):
        if not self.destination:
            spider.logger.warning("DESTINATION environment variable not set. Distance calculation disabled.")
            return

        try:
            # Use a descriptive user agent to comply with Nominatim policy
            # This helps identify our application and shows we're not abusing the service
            # Note: For production use, consider using a commercial geocoding service
            self.geolocator = Nominatim(
                user_agent="PropertyPal-Scraper-Geocoding/1.0 (https://github.com/yourusername/property-pal-scraper)",
                timeout=10
            )

            # Geocode the destination once - try multiple strategies
            spider.logger.info(f"Geocoding destination: {self.destination}")

            destination_location = self.geolocator.geocode(self.destination)

            # If exact destination fails, try a simplified version
            if not destination_location:
                # Try removing specific details and keeping just city/country
                simplified_destination = self.destination.split(',')[0].strip()
                if simplified_destination != self.destination:
                    spider.logger.info(f"Trying simplified destination: {simplified_destination}")
                    destination_location = self.geolocator.geocode(simplified_destination)

            if destination_location:
                self.destination_coords = (destination_location.latitude, destination_location.longitude)
                spider.logger.info(f"Destination coordinates: {self.destination_coords}")
            else:
                spider.logger.warning(f"Could not geocode destination: {self.destination}. Distance calculation disabled.")
                spider.logger.warning("Try using a simpler destination like 'Belfast, UK' instead of specific addresses.")
                self.geocoding_disabled = True

        except Exception as e:
            error_msg = str(e)
            if "403" in error_msg or "blocked" in error_msg.lower():
                spider.logger.error("Geocoding service blocked our requests. This may be due to:")
                spider.logger.error("  - Too many requests too quickly")
                spider.logger.error("  - User agent not properly identifying the application")
                spider.logger.error("  - Violation of Nominatim usage policy")
                spider.logger.error("Distance calculation will be disabled for this session.")
                spider.logger.error("Consider using a commercial geocoding service or waiting a few hours.")
                spider.logger.error("To disable geocoding completely, remove the DESTINATION environment variable.")
                self.geocoding_disabled = True
            else:
                spider.logger.error(f"Error initializing distance calculation: {e}")
                spider.logger.error("Distance calculation will be disabled for this session.")
                self.geocoding_disabled = True

    def process_item(self, item, spider):
        if not self.destination_coords or not self.geolocator or self.geocoding_disabled:
            return item

        adapter = ItemAdapter(item)
        location = adapter.get('location')

        if not location:
            spider.logger.warning(f"No location found for property {adapter.get('property_id')}")
            return item

        try:
            # Geocode the property location - try multiple strategies
            property_location = self.geolocator.geocode(location)

            # If exact address fails, try postcode only (last part after comma)
            if not property_location and ',' in location:
                # Extract what looks like a postcode (usually at the end)
                location_parts = [part.strip() for part in location.split(',')]
                for part in reversed(location_parts):
                    if part and (len(part.replace(' ', '')) >= 5):  # Likely a postcode
                        spider.logger.debug(f"Trying postcode/area: {part}")
                        property_location = self.geolocator.geocode(part)
                        if property_location:
                            break

            if property_location:
                property_coords = (property_location.latitude, property_location.longitude)

                # Calculate distance in kilometers
                distance = geodesic(property_coords, self.destination_coords).kilometers

                # Round to 2 decimal places
                adapter['distance_to_destination'] = round(distance, 2)

                spider.logger.debug(f"Calculated distance for {location}: {adapter['distance_to_destination']} km")
            else:
                spider.logger.debug(f"Could not geocode property location: {location}")
                adapter['distance_to_destination'] = None

            # Add longer delay to respect Nominatim's rate limits (1 request per second max)
            # Nominatim allows 1 request per second, so we use 2 seconds to be very safe
            # For bulk processing, consider using a commercial geocoding service
            time.sleep(2.0)

        except Exception as e:
            error_msg = str(e)
            if "403" in error_msg or "blocked" in error_msg.lower():
                spider.logger.error(f"Geocoding blocked for property {location}. Disabling geocoding for remaining properties.")
                spider.logger.error("Consider using a commercial geocoding service or reducing request frequency.")
                spider.logger.error("To disable geocoding completely, remove the DESTINATION environment variable.")
                self.geocoding_disabled = True
            else:
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
