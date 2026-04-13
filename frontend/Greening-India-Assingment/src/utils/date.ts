export const formatDate = (isoDate?: string): string => {
  if (!isoDate) {
    return 'No due date'
  }

  const parsed = new Date(isoDate)

  if (Number.isNaN(parsed.getTime())) {
    return 'No due date'
  }

  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
