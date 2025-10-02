import dayjs from 'dayjs'

type DayFormat = string

export function formatDay(value: dayjs.ConfigType, format: DayFormat = 'YYYY-MM-DD') {
  return dayjs(value).format(format)
}

export function formatTimespan(value: dayjs.ConfigType) {
  const now = dayjs()
  const point = dayjs(value)
  const diffDays = now.diff(point, 'day')

  if (diffDays === 0) {
    return 'Today'
  }
  if (diffDays < 31) {
    return `${diffDays} days ago`
  }
  if (diffDays < 366) {
    return `${Math.floor(diffDays / 30)} months ago`
  }
  if (Number.isFinite(diffDays)) {
    return `${Math.floor(diffDays / 365)} years ago`
  }
  return point.format('YYYY-MM-DD')
}
