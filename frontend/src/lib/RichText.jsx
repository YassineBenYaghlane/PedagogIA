import DOMPurify from "dompurify"

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "ul", "ol", "li", "code", "mark", "span"
]
const ALLOWED_ATTR = []

export default function RichText({ html, className }) {
  const clean = DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true
  })
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
