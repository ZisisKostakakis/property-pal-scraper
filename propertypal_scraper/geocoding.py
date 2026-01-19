"""Geocoding service with caching, retry logic, and multi-provider fallback."""

import json
import os
import time
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

from geopy.geocoders import Nominatim, Photon, GoogleV3, Here, MapBox, OpenCage
from geopy.distance import geodesic
from geopy.exc import GeocoderTimedOut, GeocoderServiceError, GeocoderQuotaExceeded

logger = logging.getLogger(__name__)


class GeocodingCache:
    """File-based cache for geocoding results with TTL support."""

    def __init__(self, cache_file: str, ttl_days: int = 30):
        self.cache_file = Path(cache_file)
        self.ttl_days = ttl_days
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._load_cache()

    def _load_cache(self) -> None:
        """Load cache from file if it exists."""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    self._cache = json.load(f)
                logger.info(f"Loaded {len(self._cache)} cached geocoding results")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Failed to load geocoding cache: {e}")
                self._cache = {}
        else:
            self._cache = {}

    def _save_cache(self) -> None:
        """Persist cache to file."""
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self._cache, f, indent=2, ensure_ascii=False)
        except IOError as e:
            logger.error(f"Failed to save geocoding cache: {e}")

    def _normalize_key(self, address: str) -> str:
        """Normalize address for consistent cache keys."""
        return address.lower().strip()

    def _is_expired(self, entry: Dict[str, Any]) -> bool:
        """Check if a cache entry has expired."""
        cached_at = datetime.fromisoformat(entry['cached_at'])
        return datetime.now() - cached_at > timedelta(days=self.ttl_days)

    def get(self, address: str) -> Optional[Tuple[float, float]]:
        """Get cached coordinates for an address.

        Returns:
            Tuple of (latitude, longitude) if found and not expired, None otherwise.
            Returns (None, None) tuple for addresses that failed geocoding (negative cache).
        """
        key = self._normalize_key(address)
        if key not in self._cache:
            return None

        entry = self._cache[key]
        if self._is_expired(entry):
            del self._cache[key]
            return None

        coords = entry.get('coords')
        if coords is None:
            # Negative cache entry - address couldn't be geocoded
            return (None, None)
        return tuple(coords)

    def set(self, address: str, coords: Optional[Tuple[float, float]]) -> None:
        """Cache geocoding result.

        Args:
            address: The address that was geocoded
            coords: Tuple of (latitude, longitude), or None for failed geocoding
        """
        key = self._normalize_key(address)
        self._cache[key] = {
            'coords': list(coords) if coords else None,
            'cached_at': datetime.now().isoformat()
        }
        self._save_cache()

    def clear_expired(self) -> int:
        """Remove expired entries from cache. Returns count of removed entries."""
        expired_keys = [k for k, v in self._cache.items() if self._is_expired(v)]
        for key in expired_keys:
            del self._cache[key]
        if expired_keys:
            self._save_cache()
        return len(expired_keys)


class GeocodingService:
    """Multi-provider geocoding service with caching and retry logic."""

    PROVIDER_CONFIGS = {
        'nominatim': {
            'class': Nominatim,
            'requires_key': False,
            'kwargs': {
                'user_agent': 'PropertyPal-Scraper-Geocoding/1.0',
                'timeout': 10
            }
        },
        'photon': {
            'class': Photon,
            'requires_key': False,
            'kwargs': {
                'user_agent': 'PropertyPal-Scraper-Geocoding/1.0',
                'timeout': 10
            }
        },
        'google': {
            'class': GoogleV3,
            'requires_key': True,
            'env_key': 'GOOGLE_GEOCODING_API_KEY',
            'kwargs': {'timeout': 10}
        },
        'here': {
            'class': Here,
            'requires_key': True,
            'env_key': 'HERE_API_KEY',
            'kwargs': {'timeout': 10}
        },
        'mapbox': {
            'class': MapBox,
            'requires_key': True,
            'env_key': 'MAPBOX_ACCESS_TOKEN',
            'kwargs': {'timeout': 10}
        },
        'opencage': {
            'class': OpenCage,
            'requires_key': True,
            'env_key': 'OPENCAGE_API_KEY',
            'kwargs': {'timeout': 10}
        }
    }

    def __init__(
        self,
        providers: list = None,
        max_retries: int = 3,
        base_delay: float = 1.0,
        cache_file: str = None,
        cache_ttl_days: int = 30
    ):
        """Initialize geocoding service.

        Args:
            providers: List of provider names in priority order. Defaults to ['nominatim', 'photon']
            max_retries: Maximum retry attempts per provider
            base_delay: Base delay for exponential backoff (seconds)
            cache_file: Path to cache file. If None, caching is disabled.
            cache_ttl_days: Cache TTL in days
        """
        self.providers = providers or ['nominatim', 'photon']
        self.max_retries = max_retries
        self.base_delay = base_delay

        # Initialize cache
        self.cache = GeocodingCache(cache_file, cache_ttl_days) if cache_file else None

        # Initialize geocoders for each provider
        self._geocoders = {}
        self._init_geocoders()

    def _init_geocoders(self) -> None:
        """Initialize geocoder instances for configured providers."""
        for provider in self.providers:
            if provider not in self.PROVIDER_CONFIGS:
                logger.warning(f"Unknown geocoding provider: {provider}")
                continue

            config = self.PROVIDER_CONFIGS[provider]

            # Skip providers that require keys if key not available
            if config['requires_key']:
                api_key = os.getenv(config['env_key'])
                if not api_key:
                    logger.debug(f"Skipping {provider}: {config['env_key']} not set")
                    continue
                kwargs = {**config['kwargs'], 'api_key': api_key}
            else:
                kwargs = config['kwargs'].copy()

            try:
                self._geocoders[provider] = config['class'](**kwargs)
                logger.info(f"Initialized geocoding provider: {provider}")
            except Exception as e:
                logger.warning(f"Failed to initialize {provider}: {e}")

        if not self._geocoders:
            raise ValueError("No geocoding providers available")

    def _geocode_with_retry(
        self,
        geocoder,
        address: str,
        provider_name: str
    ) -> Optional[Tuple[float, float]]:
        """Attempt geocoding with exponential backoff retry."""
        last_error = None

        for attempt in range(self.max_retries):
            try:
                location = geocoder.geocode(address)
                if location:
                    return (location.latitude, location.longitude)
                return None

            except GeocoderQuotaExceeded as e:
                logger.warning(f"{provider_name} quota exceeded: {e}")
                raise  # Don't retry quota errors, move to next provider

            except (GeocoderTimedOut, GeocoderServiceError) as e:
                last_error = e
                delay = self.base_delay * (2 ** attempt)
                logger.debug(f"{provider_name} attempt {attempt + 1} failed: {e}. Retrying in {delay}s")
                time.sleep(delay)

            except Exception as e:
                last_error = e
                if "403" in str(e) or "blocked" in str(e).lower():
                    logger.warning(f"{provider_name} blocked: {e}")
                    raise  # Don't retry blocks, move to next provider
                delay = self.base_delay * (2 ** attempt)
                logger.debug(f"{provider_name} attempt {attempt + 1} failed: {e}. Retrying in {delay}s")
                time.sleep(delay)

        logger.warning(f"{provider_name} failed after {self.max_retries} attempts: {last_error}")
        return None

    def geocode(self, address: str) -> Optional[Tuple[float, float]]:
        """Geocode an address using configured providers with fallback.

        Args:
            address: The address to geocode

        Returns:
            Tuple of (latitude, longitude) if successful, None otherwise
        """
        if not address:
            return None

        # Check cache first
        if self.cache:
            cached = self.cache.get(address)
            if cached is not None:
                if cached == (None, None):
                    logger.debug(f"Cache hit (negative): {address}")
                    return None
                logger.debug(f"Cache hit: {address} -> {cached}")
                return cached

        # Try each provider in order
        for provider_name, geocoder in self._geocoders.items():
            try:
                coords = self._geocode_with_retry(geocoder, address, provider_name)
                if coords:
                    logger.debug(f"Geocoded with {provider_name}: {address} -> {coords}")
                    if self.cache:
                        self.cache.set(address, coords)
                    # Rate limit between requests
                    time.sleep(self.base_delay)
                    return coords
            except (GeocoderQuotaExceeded, Exception) as e:
                if "403" in str(e) or "blocked" in str(e).lower() or isinstance(e, GeocoderQuotaExceeded):
                    logger.info(f"Switching from {provider_name} due to: {e}")
                    continue
                raise

        # All providers failed - cache negative result
        logger.warning(f"All geocoding providers failed for: {address}")
        if self.cache:
            self.cache.set(address, None)
        return None

    def calculate_distance(
        self,
        origin: str,
        destination_coords: Tuple[float, float]
    ) -> Optional[float]:
        """Calculate distance between an address and destination coordinates.

        Args:
            origin: Address string to geocode
            destination_coords: Tuple of (latitude, longitude) for destination

        Returns:
            Distance in kilometers, or None if geocoding fails
        """
        origin_coords = self.geocode(origin)
        if not origin_coords:
            return None

        distance = geodesic(origin_coords, destination_coords).kilometers
        return round(distance, 2)
