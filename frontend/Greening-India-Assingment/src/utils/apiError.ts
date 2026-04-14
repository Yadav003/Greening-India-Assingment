import axios from 'axios'

export const getErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { message?: string; error?: string; fields?: Record<string, string> }
      | undefined
    const fieldsMessage = responseData?.fields
      ? Object.entries(responseData.fields)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ')
      : null

    return responseData?.message ?? responseData?.error ?? fieldsMessage ?? error.message ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
