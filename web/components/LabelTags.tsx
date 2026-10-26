import { css } from 'styled-system/css'

// The space to the right of a tag, not to the left of it: a tag that wraps
// starts at the left edge of the text, and the title has the same gap after it
const tagStyle = css({
  display: 'inline-block',
  maxWidth: '100%',
  marginRight: '6px',
  padding: '1px 6px',
  verticalAlign: 'middle',
  overflowWrap: 'anywhere',
  fontSize: '12px',
  lineHeight: '1.4',
  color: 'var(--text-color)',
  border: '1px solid color-mix(in srgb, var(--text-color) 30%, transparent)',
  borderRadius: '4px',
})

// The event of a screening and its notes, each as a tag, in the flow of the
// line of text they come after
export const LabelTags = ({
  event,
  notes,
}: {
  event?: string
  notes?: string[]
}) => (
  <>
    {[event, ...(notes ?? [])].map((label) =>
      label ? (
        <span key={label} className={tagStyle}>
          {label}
        </span>
      ) : null,
    )}
  </>
)
