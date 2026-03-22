// Reading time interface
export interface ReadingTime {
  text: string
  minutes: number
  time: number
  words: number
}

// TOC item interface
export interface TOCItem {
  level: number
  text: string
  id: string
  index: number
}

// Post list item used by the UI (Sanity-backed)
export interface PostListItem {
  slug: string
  title: string
  pubDate: Date
}

// PostList component props interface
export interface PostListProps {
  posts: PostListItem[]
}

// Extra metadata injected by remark plugins when rendering a post
export interface PostRenderFrontmatter {
  readingTime?: ReadingTime
  toc?: TOCItem[]
}
