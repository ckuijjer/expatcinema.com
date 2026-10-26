import {
  buildCinemaJsonLd,
  buildLocationBreadcrumbJsonLd,
  buildWebSiteJsonLd,
} from './jsonLd'

describe('buildWebSiteJsonLd', () => {
  it('names the site and its address', () => {
    expect(buildWebSiteJsonLd()).toMatchObject({
      '@type': 'WebSite',
      name: 'Expat Cinema',
      url: 'https://www.expatcinema.com/',
    })
  })
})

describe('buildCinemaJsonLd', () => {
  it('gives a movie theater with its postal address', () => {
    expect(
      buildCinemaJsonLd(
        {
          name: 'Kijkhuis',
          url: 'https://bioscopenleiden.nl/kijkhuis/',
          address: {
            streetAddress: 'Vrouwenkerksteeg 10',
            postalCode: '2312 WS',
            addressLocality: 'Leiden',
            googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=x',
          },
        },
        'leiden',
        'kijkhuis',
      ),
    ).toMatchObject({
      '@type': 'MovieTheater',
      '@id': 'https://www.expatcinema.com/city/leiden/cinema/kijkhuis#cinema',
      name: 'Kijkhuis',
      address: { addressLocality: 'Leiden', addressCountry: 'NL' },
    })
  })
})

describe('buildLocationBreadcrumbJsonLd', () => {
  it('goes from the site to the city to the cinema', () => {
    const { itemListElement } = buildLocationBreadcrumbJsonLd(
      { slug: 'leiden', name: 'Leiden' },
      { slug: 'kijkhuis', name: 'Kijkhuis' },
    )
    expect(itemListElement.map((item) => item.item)).toEqual([
      'https://www.expatcinema.com',
      'https://www.expatcinema.com/city/leiden',
      'https://www.expatcinema.com/city/leiden/cinema/kijkhuis',
    ])
  })

  it('stops at the city without a cinema', () => {
    expect(
      buildLocationBreadcrumbJsonLd({ slug: 'leiden', name: 'Leiden' })
        .itemListElement,
    ).toHaveLength(2)
  })
})
