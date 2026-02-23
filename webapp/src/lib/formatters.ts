export function formatPrice(price: number): string {
  return `£${price.toLocaleString('en-GB')}`;
}

export function formatMonthly(monthly: number | null | undefined): string {
  if (monthly == null) return 'N/A';
  return `£${Math.round(monthly).toLocaleString('en-GB')}/mo`;
}

export function getRatingColor(score: number): string {
  if (score < 5) {
    return 'text-red-600';
  } else if (score < 7) {
    return 'text-yellow-600';
  } else {
    return 'text-green-600';
  }
}

export function getRatingBgColor(score: number): string {
  if (score < 5) {
    return 'bg-red-50';
  } else if (score < 7) {
    return 'bg-yellow-50';
  } else {
    return 'bg-green-50';
  }
}

export function getPriorityBadgeColor(score: number): string {
  if (score >= 50) {
    return 'bg-green-500 text-white';
  } else if (score >= 40) {
    return 'bg-yellow-500 text-white';
  } else {
    return 'bg-gray-500 text-white';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
}

export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm == null) return 'N/A';
  const miles = distanceKm * 0.621371;
  return `${miles.toFixed(1)}mi`;
}

export function getDistanceColor(distanceKm: number | null | undefined): string {
  if (distanceKm == null) return 'text-gray-500';
  const miles = distanceKm * 0.621371;
  if (miles <= 0.6) return 'text-green-600';
  if (miles <= 1.5) return 'text-amber-600';
  return 'text-red-600';
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 60) return 'bg-green-500 text-white';
  if (score >= 40) return 'bg-amber-500 text-white';
  return 'bg-red-500 text-white';
}
