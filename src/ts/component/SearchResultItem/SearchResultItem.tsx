import React from 'react'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { get, uniq } from 'lodash-es'
import { getDegrees } from '../../utils/getDegrees'

interface GeoPoint {
  Latitude: number;
  Longitude: number;
}

interface DOI {
  DOI?: string;
  Authority?: string
  Url?: string;
}

interface DoiLink extends DOI {
  link?: string;
  text?: string;
}

function toDateStr(dateTimeStr: string | null): string | null {
  if (dateTimeStr) return dateTimeStr.split('T')[0]

  return null
}

interface Meta {
  'concept-id': string;
  'provider-id': string;
}

interface FileDistributionInfo {
  FormatType: string;
  Format: string;
  // Add other properties if needed
}

interface Platform {
  Type?: string;
  ShortName?: string;
  LongName?: string;
}

interface Umm {
  DataCenters?: Array<{ Roles: string[], ShortName: string }>;
  ArchiveAndDistributionInformation?: {
    FileDistributionInformation?: FileDistributionInfo[];
  };
  Link: string;
  PageType: string;
  Platforms?: Platform[];
  Projects?: Array<{ ShortName: string }>;
  RelatedUrls?: Array<{ Type: string, URL: string, URLContentType?: string, Description?: string }>;
  DataDates?: Array<{ Type: string, Date: string }>;
  EntryTitle: string;
  ShortName: string;
  Version: String;
  Abstract: string;
  DOI?: DoiLink;
  TimeExtent: string;
}

export interface Metadata {
  meta: {
    'concept-id': string;
    'provider-id': string;
  };
  umm: {
    Abstract: string;
    EntryTitle: string;
    ShortName: string;
    Version: string;
    DOI?: DoiLink;
    Link: string;
    PageType: string;
    Platforms?: Platform[];
    Projects?: Array<{ ShortName: string }>;
    ArchiveAndDistributionInformation?: {
      FileDistributionInformation: Array<{
        Format: string
        FormatType: string;
        FormatDescription: string;
        AverageFileSize: number;
        AverageFileSizeUnit: string;
        TotalCollectionFileSize: number;
        TotalCollectionFileSizeUnit: string
        Description: string

      }>;
    };
    DataCenters?: Array<{ Roles: string[]; ShortName: string }>;
    RelatedUrls?: Array<{
      Type: string, URL: string
      URLContentType?: string
      description: string
    }>;
    TemporalExtents?: object
    SpatialExtent?:{
      HorizontalSpatialDomain:object
    }
    TimeExtent: string
  };
}

interface SearchResultItemProps {
  metadata: Metadata;
}

const EARTHDATA_CENTERS_BASE_URL = 'https://www.earthdata.nasa.gov/centers'

const daacSlugMap: Record<string, string> = {
  AFDRC: 'afdrc',
  ASDC: 'asdc-daac',
  ASF: 'asf-daac',
  ATMOSPHERE: 'atmosphere-sips',
  CDDIS: 'cddis-daac',
  GESDISC: 'gesdisc-daac',
  GHRC: 'ghrc-daac',
  LAADSDAAC: 'laads-daac',
  LANDSIPS: 'land-sips',
  LP: 'lp-daac',
  MLSSIPS: 'mls-sips',
  MODAPS: 'modaps-sips',
  NSIDC: 'nsidc-daac',
  OBDAAC: 'ob-daac',
  OBPG: 'obpg',
  OCEAN: 'ocean-sips',
  OMISIPS: 'omi-sips',
  OMPSSIPS: 'omps-sips',
  ORNL: 'ornl-daac',
  PODAAC: 'po-daac',
  SOUNDERSIPS: 'sounder-sips'
}

const daacSlugEntries = Object.entries(daacSlugMap)
  .sort(([left], [right]) => right.length - left.length)

function normalizeDaacKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function findDaacSlug(normalizedKey: string): string | null {
  if (daacSlugMap[normalizedKey]) return daacSlugMap[normalizedKey]

  const partialMatch = daacSlugEntries.find(([key]) => normalizedKey.includes(key))

  return partialMatch ? partialMatch[1] : null
}

function getArchiverShortName(umm: Umm): string | null {
  const archiver = (umm.DataCenters || []).find(({ Roles }) => Roles.indexOf('ARCHIVER') !== -1)

  return archiver?.ShortName || null
}

function getDaacDisplayName(shortName: string | null): string | null {
  if (!shortName) return null

  return shortName.split('/').pop()?.trim() || shortName.trim()
}

/*
// Normalize each Archiver short name by uppercasing and stripping punctuation and then
// resolve it against the known map of Centers slugs using exact match and then longest-key
// partial match second. this handles inconsistent formats like NASA/GSFC and PO.DAAC
*/
function getDataProviderLink(shortName: string | null): string | null {
  if (!shortName) return null

  const displayName = getDaacDisplayName(shortName)
  const candidates = [shortName, displayName].filter((v): v is string => Boolean(v))
  const match = candidates
    .map((candidate) => findDaacSlug(normalizeDaacKey(candidate)))
    .find((slug): slug is string => Boolean(slug))

  return match ? `${EARTHDATA_CENTERS_BASE_URL}/${match}` : null
}

function ummTemporalToHuman(umm: object): string | null {
  const singleDate = get(umm, ['TemporalExtents', 0, 'SingleDateTimes', 0])
  if (singleDate) return toDateStr(singleDate)

  const rangeDate = get(umm, ['TemporalExtents', 0, 'RangeDateTimes', 0])
  if (!rangeDate) return null

  const start = toDateStr(rangeDate.BeginningDateTime)
  const end = toDateStr(rangeDate.EndingDateTime)

  if (!start && !end) return null
  if (start === end) return start
  if (!end) return `${start} to Present`

  return `${start} to ${end}`
}

function ummSpatialToSummary(umm: object): string | null {
  const geometry = get(umm, ['SpatialExtent', 'HorizontalSpatialDomain', 'Geometry'])

  if (!geometry) return null

  const {
    Points,
    BoundingRectangles,
    GPolygons,
    CoordinateSystem
  } = geometry

  if (Points && Points[0]) {
    let result = `(${getDegrees(Points[0].Latitude)}, ${getDegrees(Points[0].Longitude)})`
    if (Points.length > 1) result += '...'

    return result
  }

  const bboxToSummary = (west: number, east: number, south: number, north: number): string => {
    if (west === -180 && east === 180 && south === -90 && north === 90) return 'Global'

    return `Latitudes ${getDegrees(south)} to ${getDegrees(north)}, Longitudes ${getDegrees(west)} to ${getDegrees(east)}`
  }

  if (BoundingRectangles && BoundingRectangles[0]) {
    if (BoundingRectangles.length > 1) return 'Multiple bounding rectangles'

    const {
      WestBoundingCoordinate: west,
      EastBoundingCoordinate: east,
      NorthBoundingCoordinate: north,
      SouthBoundingCoordinate: south
    } = BoundingRectangles[0]

    return bboxToSummary(west, east, south, north)
  }

  if (GPolygons && GPolygons[0] && CoordinateSystem === 'CARTESIAN') {
    const points = get(GPolygons, [0, 'Boundary', 'Points'], [])
    const lats = uniq(points.map((p: GeoPoint) => p.Latitude))
    const lons = uniq(points.map((p: GeoPoint) => p.Longitude))
    if (lats.length === 2 && lons.length === 2) {
      const west = Math.min(...lons as number[])
      const east = Math.max(...lons as number[])
      const south = Math.min(...lats as number[])
      const north = Math.max(...lats as number[])

      return bboxToSummary(west, east, south, north)
    }
  }

  return null
}

/**
 * Extracts a link URL and text from a UMM DOI
 * @param {*} doi UMM-C DOI metadata
 * @returns {object} a link object with keys for 'link' (href) and 'title' text
 */
function doiLink(doi: DOI) {
  if (!doi || !doi.DOI) return null

  let link = doi.Authority || 'https://doi.org/'
  if (!link.endsWith('/')) link += '/'
  // Mandatory DOI encoding rules.
  // See https://www.doi.org/the-identifier/resources/factsheets/doi-resolution-documentation#2-encoding-dois-for-use-in-uris
  link += doi.DOI
    .replaceAll('%', '%25')
    .replaceAll('"', '%22')
    .replaceAll('#', '%23')
    .replaceAll(' ', '%20')
    .replaceAll('?', '%3F')

  return {
    link,
    text: doi.DOI
  }
}

/**
 * Parses a human-readable summary from UMM-C JSON metadata
 * @param param The UMM-C metadata item with meta and umm fields
 * @returns an object summarizing the UMM-C JSON appropriate for display
 */
function ummToSummary({ meta, umm }: { meta: Meta, umm: Umm }) {
  const archiverShortName = getArchiverShortName(umm)

  const fileFormats = get(umm, ['ArchiveAndDistributionInformation', 'FileDistributionInformation'], [])
    .filter((f: FileDistributionInfo) => f.FormatType === 'Native').map((f: FileDistributionInfo) => f.Format).join(', ') || null

  const relatedUrlPlatform = (umm.RelatedUrls || []).find(({ URLContentType, URL }) => URLContentType === 'PublicationURL' && URL.includes('/data/platforms'))
  const platforms = relatedUrlPlatform
    ? [{
      href: relatedUrlPlatform.URL,
      text: relatedUrlPlatform.Description || 'platform'
    }]
    : []
  const projects = (umm.Projects || []).map((p) => p.ShortName).join(', ') || null

  const configuredLandingPage = (umm.RelatedUrls || []).find(({ Type }) => Type === 'DATA SET LANDING PAGE')

  const dates = umm.DataDates
  const createDate = dates?.find((d) => d.Type === 'CREATE')
  const published = createDate && toDateStr(createDate.Date)

  return {
    conceptId: meta['concept-id'],
    title: umm.EntryTitle,
    shortname: umm.ShortName,
    version: umm.Version,
    summary: umm.Abstract,
    temporal: ummTemporalToHuman(umm),
    spatial: ummSpatialToSummary(umm),
    configuredLandingPage: configuredLandingPage && configuredLandingPage.URL,
    doi: umm.DOI ? doiLink(umm.DOI) : undefined,
    daac: getDaacDisplayName(archiverShortName),
    dataProviderLink: getDataProviderLink(archiverShortName),
    fileFormats,
    link: umm.Link,
    pageType: umm.PageType,
    platforms,
    projects,
    published,
    providerId: meta['provider-id'],
    timeExtent: umm.TimeExtent
  }
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ metadata }) => {
  const {
    conceptId,
    title,
    summary,
    link,
    pageType,
    timeExtent,
    doi
  } = ummToSummary(metadata)

  const collection = metadata

  // Create a new object with encoded umm values
  const encodedUmm: { [key: string]: string } = {}

  Object.entries(collection.umm).forEach(([key, value]) => {
    encodedUmm[key] = encodeURIComponent(String(value))
  })

  const getFullUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }

    const { protocol, host } = window.location

    return `${protocol}//${host}${url}`
  }

  return (
    <div key={conceptId} className="hzn-search-result pb-2">
      <Row>
        <Col className="hzn-search-result__meta_metadata d-flex align-items-center">
          <span className="me-4">{pageType}</span>
          {timeExtent}
        </Col>
      </Row>
      <Row>
        <Col lg={12}>
          <h1>
            <a href={link}>{title}</a>
          </h1>
          <p
            className="hzn-search-result__abstract mb-3"
            data-testid="collection-search-result__abstract"
          >
            {summary}
          </p>
          <div className="hzn-search-result__shortname-version-doi d-flex mb-2 mt-1">
            {
              doi && (
                <a className="hzn-search-result__doi-link" href={link}>{decodeURIComponent(getFullUrl(link))}</a>
              )
            }
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default SearchResultItem
