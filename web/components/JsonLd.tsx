import { serializeJsonLd } from '../utils/jsonLd'

type Data = Parameters<typeof serializeJsonLd>[0]

export const JsonLd = ({ data }: { data: Data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
  />
)
