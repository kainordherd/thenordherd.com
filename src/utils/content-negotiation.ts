export const NEGOTIABLE_CONTENT_TYPES = ['text/html', 'text/markdown'] as const

export type NegotiatedContentType = (typeof NEGOTIABLE_CONTENT_TYPES)[number]

type AcceptEntry = {
  type: string
  q: number
  specificity: number
  index: number
}

function splitAcceptHeader(header: string) {
  const parts: string[] = []
  let part = ''
  let quoted = false

  for (let index = 0; index < header.length; index++) {
    const char = header[index]
    const previousChar = header[index - 1]

    if (char === '"' && previousChar !== '\\') {
      quoted = !quoted
    }

    if (char === ',' && !quoted) {
      parts.push(part)
      part = ''
      continue
    }

    part += char
  }

  if (part) {
    parts.push(part)
  }

  return parts
}

function mediaRangeSpecificity(mediaRange: string) {
  if (mediaRange === '*/*') {
    return 0
  }

  if (mediaRange.endsWith('/*')) {
    return 1
  }

  return 2
}

function parseAcceptHeader(header: string) {
  return splitAcceptHeader(header)
    .map<AcceptEntry | null>((part, index) => {
      const [rawMediaRange, ...rawParams] = part.split(';')
      const mediaRange = rawMediaRange.trim().toLowerCase()

      if (!mediaRange.includes('/')) {
        return null
      }

      let q = 1

      for (const rawParam of rawParams) {
        const [rawName, rawValue] = rawParam.split('=')
        const name = rawName.trim().toLowerCase()

        if (name !== 'q' || rawValue === undefined) {
          continue
        }

        const value = rawValue.trim().replace(/^"|"$/g, '')
        const parsed = Number(value)

        if (Number.isFinite(parsed)) {
          q = Math.max(0, Math.min(1, parsed))
        }
      }

      return {
        type: mediaRange,
        q,
        specificity: mediaRangeSpecificity(mediaRange),
        index
      }
    })
    .filter((entry): entry is AcceptEntry => entry !== null)
}

function mediaRangeMatches(mediaRange: string, contentType: NegotiatedContentType) {
  if (mediaRange === '*/*') {
    return true
  }

  if (mediaRange.endsWith('/*')) {
    return contentType.startsWith(mediaRange.slice(0, -1))
  }

  return mediaRange === contentType
}

function qualityForContentType(entries: AcceptEntry[], contentType: NegotiatedContentType) {
  const matches = entries.filter((entry) => mediaRangeMatches(entry.type, contentType))

  if (matches.length === 0) {
    return null
  }

  return matches.sort((a, b) => b.specificity - a.specificity || b.q - a.q || a.index - b.index)[0]
}

export function preferredContentType(acceptHeader: string | null): NegotiatedContentType | null {
  if (!acceptHeader) {
    return 'text/html'
  }

  const entries = parseAcceptHeader(acceptHeader)

  if (entries.length === 0) {
    return 'text/html'
  }

  const preferred = NEGOTIABLE_CONTENT_TYPES.map((contentType, index) => {
    const quality = qualityForContentType(entries, contentType)

    return quality && quality.q > 0 ? { contentType, quality, index } : null
  })
    .filter(
      (match): match is { contentType: NegotiatedContentType; quality: AcceptEntry; index: number } => match !== null
    )
    .sort((a, b) => b.quality.q - a.quality.q || b.quality.specificity - a.quality.specificity || a.index - b.index)[0]

  return preferred?.contentType ?? null
}

export function appendVaryAccept(headers: Headers) {
  const vary = headers.get('Vary')

  if (!vary) {
    headers.set('Vary', 'Accept')
    return
  }

  const values = vary.split(',').map((value) => value.trim().toLowerCase())

  if (!values.includes('accept') && !values.includes('*')) {
    headers.set('Vary', `${vary}, Accept`)
  }
}
