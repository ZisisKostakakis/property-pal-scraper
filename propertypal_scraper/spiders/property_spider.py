import scrapy
from propertypal_scraper.items import PropertyListing
import re


class PropertySpider(scrapy.Spider):
    name = "property_spider"
    allowed_domains = ["propertypal.com"]
    def __init__(self, url=None, use_perplexity='false', *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set start_urls from parameter or use default
        if url:
            self.start_urls = [url]
        else:
            # Default to new URL format for backward compatibility
            self.start_urls = [
                "https://www.propertypal.com/property-for-sale/belfast/bedrooms-2-6/price-100000-140000/sort-dateHigh"
            ]
        # Convert string to boolean
        self.use_perplexity = use_perplexity.lower() in ('true', '1', 'yes', 'on')
        self.logger.info(f"Starting URL: {self.start_urls[0]}")
        self.logger.info(f"Perplexity rating enabled: {self.use_perplexity}")

    def parse(self, response):
        """Parse search results page"""
        self.logger.info(f"Parsing search page: {response.url}")

        # Extract property links from listing container
        # Multiple selectors for robustness
        property_links = (
            response.css('li.pp-property-box a::attr(href)').getall() or
            response.css('li[class*="property-box"] a::attr(href)').getall() or
            response.xpath('//li[contains(@class, "property-box")]//a/@href').getall()
        )

        self.logger.info(f"Found {len(property_links)} property links")

        for link in property_links:
            yield response.follow(link, callback=self.parse_property)

        # Handle pagination - supports both /page-N and ?page=N formats
        page_links = (
            response.xpath('//a[contains(@href, "page=") or contains(@href, "/page-")]/@href').getall()
        )

        if page_links:
            page_numbers = set()
            for link in page_links:
                # Match both page=N and /page-N formats
                match = re.search(r'(?:page=|/page-)(\d+)', link)
                if match:
                    page_numbers.add(int(match.group(1)))

            # Find current page from URL
            current_page_match = re.search(r'(?:page=|/page-)(\d+)', response.url)
            current_page = int(current_page_match.group(1)) if current_page_match else 1

            next_page_num = current_page + 1

            if next_page_num in page_numbers:
                # Build next page URL based on URL format
                if '/page-' in response.url:
                    next_url = re.sub(r'/page-\d+', f'/page-{next_page_num}', response.url)
                elif 'page=' in response.url:
                    next_url = re.sub(r'page=\d+', f'page={next_page_num}', response.url)
                elif '?' in response.url:
                    next_url = f"{response.url}&page={next_page_num}"
                else:
                    # Default to /page-N for clean URLs
                    next_url = f"{response.url}/page-{next_page_num}"

                self.logger.info(f"Following pagination to page {next_page_num}: {next_url}")
                yield response.follow(next_url, callback=self.parse)
            else:
                self.logger.info(f"No more pages (current: {current_page}, available: {sorted(page_numbers)})")
        else:
            self.logger.info("No pagination found")

    def parse_property(self, response):
        """Parse individual property detail page"""
        self.logger.info(f"Parsing property: {response.url}")

        # Extract property ID from URL
        property_id = response.url.split('/')[-1]

        # Extract price - multiple approaches for robustness
        price_raw = (
            response.css('strong.sc-558be35d-11.bsuJNc::text').get() or
            response.css('strong.pp-property-price-bold::text').get() or
            response.css('strong[class*="price-bold"]::text').get() or
            response.xpath('//strong[contains(@class, "price")]/text()').get()
        )

        # Extract location - h1 (street) + first p (city, postcode)
        h1_text = response.css('h1.sc-558be35d-0::text').get() or response.css('h1::text').get()
        postcode_text = response.css('p.sc-558be35d-5.dhUdB::text').get()

        location_parts = [h1_text.strip() if h1_text else None, postcode_text.strip() if postcode_text else None]
        location = ' '.join([part for part in location_parts if part])

        # Extract property type
        property_type = (
            response.css('p.sc-558be35d-5.fmPVlC::text').get() or
            response.css('p.property-type::text').get() or
            response.xpath('//p[contains(text(), "Bed")]//text()').get()
        )

        # Extract bedrooms
        bedrooms_text = (
            response.css('.pp-summary-icon-beds + p.sc-558be35d-5::text').get() or
            response.css('.pp-summary-icon-beds + p::text').get()
        )
        if bedrooms_text:
            bedrooms_match = re.search(r'(\d+)', bedrooms_text)
            bedrooms_text = bedrooms_match.group(1) if bedrooms_match else bedrooms_text
        else:
            # Fallback: extract from property type
            bedrooms_match = re.search(r'(\d+)\s+Bed', property_type or '')
            bedrooms_text = bedrooms_match.group(1) if bedrooms_match else None

        # Extract receptions
        receptions_text = (
            response.css('.pp-summary-icon-receptions + p.sc-558be35d-5::text').get() or
            response.css('.pp-summary-icon-receptions + p::text').get()
        )
        if receptions_text:
            receptions_match = re.search(r'(\d+)', receptions_text)
            receptions_text = receptions_match.group(1) if receptions_match else receptions_text

        # Extract bathrooms
        bathrooms_text = (
            response.css('.pp-summary-icon-baths + p.sc-558be35d-5::text').get() or
            response.css('.pp-summary-icon-bathrooms + p::text').get()
        )
        if bathrooms_text:
            bathrooms_match = re.search(r'(\d+)', bathrooms_text)
            bathrooms_text = bathrooms_match.group(1) if bathrooms_match else bathrooms_text

        # Extract Property Features
        # Size
        size = None
        size_elem = response.xpath('//p[span[contains(text(), "Size")]]/following-sibling::p/span/text()').get()
        if not size_elem:
            size_elem = response.xpath('//div[contains(@class, "pp-property-summary")]//p[contains(text(), "sq m") or contains(text(), "sq ft")]/span/text()').get()
        size = size_elem.strip() if size_elem else None

        # Tenure
        tenure = None
        tenure_elem = response.xpath('//p[span[contains(text(), "Tenure")]]/following-sibling::p/span/text()').get()
        if not tenure_elem:
            tenure_elem = response.xpath('//div[contains(@class, "pp-property-summary")]//p[contains(text(), "Leasehold") or contains(text(), "Freehold")]/span/text()').get()
        tenure = tenure_elem.strip() if tenure_elem else None

        # Energy Rating
        energy_rating = None
        energy_elem = response.xpath('//p[contains(text(), "Energy Rating")]/following-sibling::p//button/text()').get()
        if not energy_elem:
            energy_elem = response.xpath('//div[contains(@class, "pp-property-summary")]//p[contains(@class, "pp-epc-text") or contains(text(), "F") or contains(text(), "G") or contains(text(), "E")]/button/text()').get()
        energy_rating = energy_elem.strip() if energy_elem else None

        # Heating
        heating = None
        heating_elem = response.xpath('//p[span[contains(text(), "Heating")]]/following-sibling::p/span/text()').get()
        if not heating_elem:
            heating_elem = response.xpath('//div[contains(@class, "pp-property-summary")]//p[contains(text(), "Oil") or contains(text(), "Gas")]/span/text()').get()
        heating = heating_elem.strip() if heating_elem else None

        # Extract Property Financials
        # Typical Mortgage
        typical_mortgage = None
        mortgage_elem = response.xpath('//p[contains(text(), "Typical Mortgage")]/following-sibling::p//button/text()').get()
        if not mortgage_elem:
            mortgage_elem = response.xpath('//button[contains(@class, "pp-stamp-duty-text") and contains(text(), "per month")]/text()').get()
        if mortgage_elem:
            # Remove "Typical Mortgage" prefix if present
            typical_mortgage = mortgage_elem.strip().replace('Typical Mortgage', '').strip()
        else:
            typical_mortgage = None

        # Rates
        rates = None
        rates_elem = response.xpath('//p[span[contains(text(), "Rates")]]/following-sibling::p/span/text()').get()
        if not rates_elem:
            rates_elem = response.xpath('//div[contains(@class, "pp-property-summary")]//p[contains(text(), "pa")]/span/text()').get()
        rates = rates_elem.strip() if rates_elem else None

        # Extract description
        description_html = response.css('.pp-property-description').get()
        description = response.css('.pp-property-description *::text').getall()
        description_text = ' '.join([text.strip() for text in description if text.strip()])

        # Extract additional info (bullet points)
        additional_info_items = response.css('.pp-property-description ul li::text').getall()
        additional_info = '\n'.join([f"• {item.strip()}" for item in additional_info_items if item.strip()])

        # Extract features
        features = response.css('.pp-property-description ul li::text').getall()
        features_clean = [feat.strip() for feat in features if feat.strip()]

        # Extract room details (from description sections)
        room_details = []
        room_sections = response.css('.pp-property-description dl')
        for section in room_sections:
            room_name = section.css('dt::text').get()
            room_desc = section.css('dd::text').get()
            if room_name:
                room_details.append(f"{room_name.strip()}: {room_desc.strip() if room_desc else ''}")

        # Extract directions
        directions_section = response.xpath('//h2[contains(text(), "Directions")]/following-sibling::p//text()').getall()
        directions = ' '.join([d.strip() for d in directions_section if d.strip()])

        # Create PropertyListing item
        property_data = {
            'property_id': property_id,
            'url': response.url,
            'price': price_raw,
            'location': location,
            'property_type': property_type or 'Unknown',
            'bedrooms': bedrooms_text,
            'bathrooms': bathrooms_text,
            'receptions': receptions_text,
            'size': size,
            'tenure': tenure,
            'energy_rating': energy_rating,
            'heating': heating,
            'typical_mortgage': typical_mortgage,
            'rates': rates,
            'description': description_text,
            'additional_info': additional_info,
            'room_details': room_details,
            'directions': directions if directions else None,
            'features': features_clean,
        }

        try:
            # Validate with Pydantic model
            listing = PropertyListing(**property_data)
            yield listing.model_dump()
        except Exception as e:
            self.logger.error(f"Failed to create PropertyListing for {response.url}: {e}")
            self.logger.error(f"Data: {property_data}")
            # Still yield partial data for debugging
            yield property_data
