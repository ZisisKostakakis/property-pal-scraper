# PropertyPal Scraper

A Scrapy-based web scraper for extracting property listings from PropertyPal.com with integrated Perplexity AI property ratings. Extracts detailed property information including prices, locations, descriptions, and provides AI-powered investment analysis.

## Requirements

- Python 3.9+
- Virtual environment (recommended)

## Installation

### Quick Setup (Recommended)

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd property-pal-scraper
   ```

2. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

That's it! The setup script will create a virtual environment and install all dependencies.

### Manual Setup

If you prefer to set up manually:

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

4. **Configure Perplexity API** (optional):
   ```bash
   cp .env.example .env
   # Edit .env and add your Perplexity API key
   ```

## Usage

### Quick Start

After running `./setup.sh`, you can immediately start scraping:

```bash
# Run with AI property ratings (recommended)
make run

# Run without AI ratings (faster)
make run-fast
```

### Makefile Commands

```bash
make help           # Show all available commands
make install        # Create venv and install dependencies
make test-geocoding # Test geocoding functionality
make run            # Run scraper with AI ratings
make run-fast       # Run scraper without AI ratings (faster)
make clean          # Clean Python cache files
make clean-data     # Clean all scraped data
make clean-all      # Clean everything
```

### Manual Scrapy Commands

For advanced usage or custom parameters:

```bash
# Activate virtual environment first
source venv/bin/activate

# Basic run with AI ratings
scrapy crawl property_spider

# Run without AI ratings (faster)
scrapy crawl property_spider -a use_perplexity=false

# With custom settings
scrapy crawl property_spider -a use_perplexity=true -s DOWNLOAD_DELAY=2
```

### Output Files

The scraper creates timestamped output files in the `data/` directory:
- `data/raw/properties_{timestamp}.json` - Complete structured data
- `data/processed/properties_{timestamp}.csv` - Excel-compatible CSV
- `data/ratings/perplexity_ratings_{timestamp}.json` - AI ratings (when enabled)

### Advanced Options

**Run with custom logging level**:
```bash
scrapy crawl property_spider -L INFO
```

**Export to specific file**:
```bash
scrapy crawl property_spider -o custom_output.json
```

**Dry run (test selectors without saving)**:
```bash
scrapy crawl property_spider --nolog
```

## Data Schema

Each property listing includes:

| Field | Type | Description |
|-------|------|-------------|
| `property_id` | string | Unique ID from URL |
| `url` | string | Full property URL |
| `scraped_at` | datetime | Timestamp of scrape |
| `price` | int | Price in GBP (numeric) |
| `location` | string | Full address |
| `property_type` | string | E.g., "2 Bed Apartment" |
| `bedrooms` | int | Number of bedrooms |
| `bathrooms` | int | Number of bathrooms (if available) |
| `receptions` | int | Number of reception rooms |
| `description` | string | Full property description |
| `additional_info` | string | Bullet point features |
| `room_details` | list | Room-by-room details |
| `directions` | string | Driving directions |
| `features` | list | Property features (e.g., "UPVC Double Glazing") |
| `calculated_monthly_payment` | float | Calculated monthly payment (£15K deposit, 4%, 40 years) |
| `perplexity_rating` | float | AI rating out of 10 |
| `perplexity_analysis` | string | Detailed AI analysis with pros/cons |

## Configuration

### Modify Search Parameters

Edit `property_spider.py` line 8 to change search criteria:

```python
start_urls = [
    "https://www.propertypal.com/search?min=100000&max=200000&term=BT2"
]
```

### Adjust Rate Limiting

Edit `settings.py` to change delays:

```python
DOWNLOAD_DELAY = 3  # Increase to 3 seconds
CONCURRENT_REQUESTS = 2  # Reduce concurrent requests
```

## Project Structure

```
property-pal-scraper/
├── propertypal_scraper/
│   ├── spiders/
│   │   └── property_spider.py    # Main spider logic
│   ├── items.py                  # Pydantic data models
│   ├── pipelines.py              # Export pipelines
│   ├── perplexity_rating.py      # AI rating integration
│   ├── settings.py               # Scrapy configuration
│   └── middlewares.py            # Middleware (default)
├── data/
│   ├── raw/                      # JSON output files
│   ├── processed/                # CSV output files
│   └── ratings/                  # Perplexity AI ratings
├── requirements.txt              # Python dependencies
├── scrapy.cfg                    # Scrapy project config
├── .env.example                  # Environment variables template
└── README.md
```

## Testing

### Test with Scrapy Shell

Test selectors on a specific property page:

```bash
scrapy shell "https://www.propertypal.com/18-leitrim-street-kings-court-belfast/1052770"
```

Then test CSS selectors:
```python
response.css('strong.pp-property-price-bold::text').get()
response.css('h1::text').getall()
response.css('.pp-summary-icon-beds + p::text').get()
```

### Validate Output

Check generated JSON:
```bash
cat data/raw/properties_*.json | python -m json.tool
```

Check CSV in Excel or with pandas:
```python
import pandas as pd
df = pd.read_csv('data/processed/properties_20250107_120000.csv')
print(df.head())
```

## Troubleshooting

### Issue: `scrapy: command not found`

**Solution**: Activate virtual environment first:
```bash
source venv/bin/activate
```

### Issue: No properties scraped

**Solution**: Test if site structure changed:
```bash
scrapy shell "https://www.propertypal.com/search?term=BT1"
# Check if property links exist:
response.css('li.pp-property-box a::attr(href)').getall()
```

### Issue: Missing mortgage calculator data

**Reason**: Data may require JavaScript rendering.

**Solution**: Static HTML extraction is attempted first. If data is missing, check the logs for warnings.

### Issue: IP blocked (403 errors)

**Solution**: Increase `DOWNLOAD_DELAY` in `settings.py`:
```python
DOWNLOAD_DELAY = 5  # Increase to 5 seconds
```

### Issue: Geocoding blocked (403 errors from Nominatim)

**Symptoms**: Error messages about geocoding service blocking requests.

**Solutions**:
1. **Wait and retry**: Nominatim blocks usually lift after a few hours of inactivity
2. **Disable geocoding temporarily**: Remove `DESTINATION` from your `.env` file
3. **Use commercial service**: Switch to Google Maps, Mapbox, or other paid geocoding APIs
4. **Reduce frequency**: The scraper now uses 2-second delays between geocoding requests

**Example**: To disable geocoding, edit your `.env` file:
```bash
# Comment out or remove this line
# DESTINATION="Belfast, UK"
```

## Performance

- **Total properties**: ~30-60 (3 pages × 10-20 per page)
- **Execution time**: 2-5 minutes (with 2s delay)
- **Data size**: <1MB JSON, <100KB CSV

## Legal & Ethical Use

- **Respects robots.txt**: Scraper obeys PropertyPal's robots.txt rules
- **Rate limiting**: 2-second delays prevent server overload
- **User-agent identification**: Bot identifies itself in requests
- **Terms of Service**: Ensure compliance with PropertyPal's Terms of Service
- **Personal Use**: Intended for research and personal property search

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `scrapy crawl property_spider`
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review Scrapy docs: https://docs.scrapy.org/
- Open an issue on GitHub

## Perplexity AI Integration

The scraper integrates with Perplexity's Housing Agent space to provide AI-powered property ratings.

### Features
- **Automatic Rating**: Each property gets a rating out of 10 (optional)
- **Investment Analysis**: Pros, cons, and outlook provided (optional)
- **Financial Calculations**: Monthly mortgage payments (£15K deposit, 4% interest, 40 years)
- **Distance Calculation**: Calculates distance from properties to a destination location
- **Market Context**: AI analyzes location, property type, and market conditions

### Configuration
Set your environment variables in `.env`:
```bash
# Perplexity API key (optional - rating disabled if not set)
PERPLEXITY_API_KEY=your_key_here

# Destination for distance calculations
DESTINATION="Belfast City Centre, Northern Ireland"
```

Without a Perplexity API key, the scraper still works but skips the rating pipeline. The DESTINATION variable is used to calculate distances from each property to your specified location.

**Geocoding Service**: The scraper uses OpenStreetMap's Nominatim service for distance calculations.

**⚠️ Important**: Nominatim has strict usage policies and may block requests for bulk processing. If you encounter 403 errors:
- Wait several hours (the block usually lifts automatically)
- Use simpler destination names (e.g., "Belfast, UK" instead of specific addresses)
- Reduce scraping frequency or disable geocoding temporarily
- The scraper will automatically disable geocoding if blocked

**For Production/Heavy Use**: Consider commercial geocoding services:
- **Google Maps Geocoding API** - Most accurate, requires API key
- **Mapbox Geocoding API** - Good accuracy, generous free tier
- **Here Maps Geocoding API** - Enterprise-grade service
- **OpenCage Geocoding API** - Simple REST API

**To Disable Geocoding**: Remove the `DESTINATION` environment variable from your `.env` file.

**Destination Examples**:
```bash
DESTINATION="Belfast, UK"
DESTINATION="Dublin, Ireland"
DESTINATION="London, England"
DESTINATION="Manchester, UK"
DESTINATION="Belfast City Centre, Northern Ireland"
```

## Changelog

### v1.1.0 (2026-01-07)
- Added Perplexity AI property rating integration
- Automated mortgage calculation (£15K deposit, 4%, 40 years)
- Housing Agent space for market analysis
- Investment scoring and recommendations

### v1.0.0 (2026-01-07)
- Initial release
- Search page parsing with pagination
- Property detail extraction
- JSON/CSV export pipelines
- Pydantic data validation
- Rate limiting and user-agent rotation
