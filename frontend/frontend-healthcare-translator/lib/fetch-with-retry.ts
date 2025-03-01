import { API_CONFIG } from "./api-config"

export async function fetchWithRetry(url: string, options: RequestInit, retries = API_CONFIG.retries) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, API_CONFIG.retryDelay))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

