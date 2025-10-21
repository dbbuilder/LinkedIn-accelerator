/**
 * Server-side API utilities for making authenticated requests
 */

import { auth } from '@clerk/nextjs/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface FetchOptions extends RequestInit {
  requireAuth?: boolean
}

/**
 * Server-side fetch helper that automatically adds authentication
 */
export async function serverFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { requireAuth = true, headers = {}, ...fetchOptions } = options

  let authHeaders = {}

  if (requireAuth) {
    const { userId } = await auth()
    if (userId) {
      authHeaders = { 'x-user-id': userId }
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  return fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    cache: options.cache || 'no-store',
  })
}

/**
 * Server-side fetch helper that returns JSON
 */
export async function serverFetchJSON<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T | null> {
  try {
    const response = await serverFetch(endpoint, options)

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`)
      return null
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error)
    return null
  }
}
