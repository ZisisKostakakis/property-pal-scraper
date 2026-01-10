import os
import requests
from typing import Dict, Any


class PerplexityPropertyRater:
    """Rate properties using Perplexity's Housing Agent space"""

    DEPOSIT = 15000
    INTEREST_RATE = 0.04
    LOAN_TERM_YEARS = 40

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('PERPLEXITY_API_KEY')
        if not self.api_key:
            raise ValueError("PERPLEXITY_API_KEY not set")

        self.base_url = "https://api.perplexity.ai/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def calculate_monthly_payment(self, price: int) -> float:
        """Calculate monthly mortgage payment"""
        if not price or price <= self.DEPOSIT:
            return 0.0

        loan_amount = price - self.DEPOSIT
        monthly_rate = self.INTEREST_RATE / 12
        num_payments = self.LOAN_TERM_YEARS * 12

        monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / \
                         ((1 + monthly_rate) ** num_payments - 1)

        return round(monthly_payment, 2)

    def build_prompt(self, property_data: Dict[str, Any]) -> str:
        """Build prompt for Perplexity Housing Agent"""
        price = property_data.get('price', 0)
        monthly_payment = self.calculate_monthly_payment(price)

        prompt = f"""Analyze this property and rate it out of 10 based on value for money, location, features, and investment potential.

Property Details:
- Location: {property_data.get('location', 'Unknown')}
- Price: £{price:,} GBP
- Property Type: {property_data.get('property_type', 'Unknown')}
- Bedrooms: {property_data.get('bedrooms', 'N/A')}
- Bathrooms: {property_data.get('bathrooms', 'N/A')}
- Receptions: {property_data.get('receptions', 'N/A')}
- Size: {property_data.get('size', 'N/A')}
- Tenure: {property_data.get('tenure', 'N/A')}
- Energy Rating: {property_data.get('energy_rating', 'N/A')}
- Heating: {property_data.get('heating', 'N/A')}
- Rates: {property_data.get('rates', 'N/A')}

Financial Analysis:
- Deposit: £{self.DEPOSIT:,}
- Loan Amount: £{price - self.DEPOSIT:,}
- Interest Rate: {self.INTEREST_RATE * 100}%
- Loan Term: {self.LOAN_TERM_YEARS} years
- Calculated Monthly Payment: £{monthly_payment:,.2f}

Description:
{property_data.get('description', 'No description available')}

Please provide:
1. A rating out of 10
2. Brief justification (2-3 sentences)
3. Key pros and cons
4. Investment outlook

Format your response as:
Rating: X/10
Justification: [your analysis]
Pros: [list]
Cons: [list]
Outlook: [brief outlook]"""

        return prompt

    def rate_property(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """Rate a property using Perplexity API with Housing Agent space"""
        prompt = self.build_prompt(property_data)

        payload = {
            "model": "sonar",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a property investment analyst specializing in UK real estate. Provide objective, data-driven property ratings."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.2,
            "max_tokens": 1000
        }

        try:
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()

            result = response.json()
            rating_text = result['choices'][0]['message']['content']

            # Extract rating number and clean analysis - handle "Rating: X/10" with any number of markdown asterisks
            rating_score = None
            analysis_clean = rating_text  # Default to full text if extraction fails

            lines = rating_text.split('\n')
            for i, line in enumerate(lines):
                line_stripped = line.strip()
                # Check if line contains Rating:
                if 'Rating:' in line_stripped:
                    # Find the Rating: part and extract everything after it
                    rating_index = line_stripped.find('Rating:')
                    rating_part = line_stripped[rating_index + len('Rating:'):].strip()
                    # Remove any remaining asterisks and extract the number
                    rating_clean = rating_part.lstrip('*').rstrip('*').strip()
                    rating_score = float(rating_clean.split('/')[0])

                    # Remove the rating line and any empty lines that follow it from the analysis
                    analysis_lines = lines[i+1:]  # Everything after the rating line
                    # Remove leading empty lines
                    while analysis_lines and analysis_lines[0].strip() == '':
                        analysis_lines = analysis_lines[1:]
                    analysis_clean = '\n'.join(analysis_lines).strip()
                    break

            return {
                'rating_score': rating_score,
                'rating_text': analysis_clean,  # Now contains only the analysis, not the rating
                'monthly_payment': self.calculate_monthly_payment(property_data.get('price', 0)),
                'property_id': property_data.get('property_id'),
                'url': property_data.get('url')
            }

        except requests.exceptions.RequestException as e:
            return {
                'rating_score': None,
                'rating_text': f"Error: {str(e)}",
                'monthly_payment': self.calculate_monthly_payment(property_data.get('price', 0)),
                'property_id': property_data.get('property_id'),
                'url': property_data.get('url')
            }
