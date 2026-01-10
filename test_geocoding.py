#!/usr/bin/env python3
"""
Test script for geocoding functionality
Run this to verify geocoding works before running the full scraper
"""

import os
import sys
import time
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

def test_geocoding():
    """Test geocoding with various destination formats"""
    print("🧪 Testing geocoding functionality...")

    # Initialize geolocator with the same settings as the pipeline
    geolocator = Nominatim(
        user_agent="PropertyPal-Scraper-Geocoding-Test/1.0 (Research project; property-analysis@example.com)",
        timeout=10
    )

    # Test destinations
    test_destinations = [
        "Belfast, UK",
        "Belfast, Northern Ireland",
        "Lanyon Place Station, East Bridge Street, Belfast, UK",  # The problematic one
        "Dublin, Ireland"
    ]

    for destination in test_destinations:
        try:
            print(f"\n📍 Testing destination: {destination}")
            location = geolocator.geocode(destination)

            if location:
                coords = (location.latitude, location.longitude)
                print(f"✅ Found coordinates: {coords}")
                print(f"   Address: {location.address}")
            else:
                print("❌ Could not geocode destination")

            # Respect rate limits
            time.sleep(1.5)

        except Exception as e:
            print(f"❌ Error: {e}")

    # Test property geocoding
    print("
🏠 Testing property geocoding..."    test_properties = [
        "77 Reid Street Cregagh Road, Belfast, BT6 8PE",
        "Apartment 10 9 Brown Square Belfast, BT13 2BW",
        "BT1 1AA"  # Just postcode
    ]

    # Use Belfast as destination for distance calculation
    destination_coords = None
    try:
        dest_location = geolocator.geocode("Belfast, UK")
        if dest_location:
            destination_coords = (dest_location.latitude, dest_location.longitude)
            print(f"📍 Using destination coordinates: {destination_coords}")
    except Exception as e:
        print(f"❌ Could not geocode destination: {e}")
        return

    for property_addr in test_properties:
        try:
            print(f"\n🏠 Testing property: {property_addr}")
            prop_location = geolocator.geocode(property_addr)

            if prop_location:
                prop_coords = (prop_location.latitude, prop_location.longitude)
                print(f"✅ Property coordinates: {prop_coords}")

                if destination_coords:
                    distance = geodesic(prop_coords, destination_coords).kilometers
                    print(f"📏 Distance to destination: {round(distance, 2)} km")
            else:
                print("❌ Could not geocode property")

            # Respect rate limits
            time.sleep(1.5)

        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_geocoding()
