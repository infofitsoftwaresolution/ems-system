/**
 * Utility functions for handling image URLs
 * Handles both development and production environments
 */

/**
 * Get the base URL for API requests and static files
 * In production, uses same origin (via nginx proxy)
 * In development, uses VITE_API_URL or localhost:3001
 */
export function getBaseUrl() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_API_URL || "http://localhost:3001";
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  const isProduction = import.meta.env.PROD;

  // In production, always use same origin (nginx serves everything)
  if (isProduction) {
    return window.location.origin;
  }

  // Development: If VITE_API_URL is set and is absolute URL
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    return apiUrl.replace(/\/api\/?$/, ''); // Remove /api suffix if present
  }

  // Development: If VITE_API_URL is relative, use current origin
  if (apiUrl && apiUrl.startsWith('/')) {
    return window.location.origin;
  }

  // Development fallback
  return "http://localhost:3001";
}

/**
 * Construct a full URL for an image/avatar
 * @param {string} imagePath - Relative path like /uploads/avatars/filename.jpg
 * @returns {string} Full URL to the image
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Ensure path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  const baseUrl = getBaseUrl();
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Get avatar URL with fallback
 * @param {string|null|undefined} avatarPath - Avatar path from database
 * @param {number|string} cacheBust - Optional cache busting parameter (timestamp or version)
 * @returns {string|null} Full URL or null
 */
export function getAvatarUrl(avatarPath, cacheBust = null) {
  const url = getImageUrl(avatarPath);
  if (!url) return null;
  
  // Add cache busting parameter if provided (useful after upload)
  if (cacheBust !== null) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${cacheBust}`;
  }
  
  return url;
}

