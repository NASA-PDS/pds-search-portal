import React from 'react'
import SearchFilterSection from '../SearchFilterSection/SearchFilterSection'
import SearchFilterSectionList from '../SearchFilterSectionList/SearchFilterSectionList'
import FacetChecklist from '../FacetChecklist/FacetChecklist'

import { Facet } from '../../../types/global'

import './SearchFilters.scss'

interface SearchFiltersProps {
  facets: object;
  setQueryString: (_query: string) => void;
  setSidebarOpened: (_isOpened: boolean) => void;
}

const findFacet = (facets: Facet, title: string): Facet | null => {
  if (!facets || !facets.children) return null

  return facets.children.find((c) => c.title === title) || null
}

const findChildFacets = (facets: Facet, title: string): Facet[] => {
  const facet = findFacet(facets, title)
  if (!facet || !facet.children) return []

  return facet.children
}

const ickyValues = ['-Na-', 'Not Provided', 'Other (Ames)']

const namesToParams: { [key: string]: string } = {
  Keywords: 'science_keywords_h',
  Platforms: 'platforms_h',
  Organizations: 'data_center_h',
  'Horizontal Data Resolution': 'horizontal_data_resolution_range',
  'Data Format': 'granule_data_format_h',
  'Processing Levels': 'processing_level_id',
  Latency: 'latency'
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  facets,
  setQueryString,
  setSidebarOpened
}) => {
  const onChange = (facet: Facet, isChecked: boolean) => {
    const { apply, remove } = facet.links || {}
    if (isChecked && apply) {
      setQueryString(apply.split('?')[1])
    }

    if (!isChecked && remove) {
      setQueryString(remove.split('?')[1])
    }
  }

  const getFacets = (t: string) => findChildFacets(facets as Facet, t)
    .filter(({ title }) => !ickyValues.includes(title))

  return (
    <SearchFilterSectionList
      defaultActiveKey={['1', '2', '3', '4']}
      setSidebarOpened={setSidebarOpened}
    >
      {
        getFacets('PageTypes').length > 0 && (
          <SearchFilterSection title="Page Types" eventKey="1" setSidebarOpened={setSidebarOpened}>
            <FacetChecklist
              name="pageTypes"
              param={namesToParams.PageTypes}
              facets={getFacets('PageTypes')}
              onChange={onChange}
              humanize={(name) => name.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            />
          </SearchFilterSection>
        )
      }
      {
        getFacets('Investigations').length > 0 && (
          <SearchFilterSection title="Investigations" eventKey="2" setSidebarOpened={setSidebarOpened}>
            <FacetChecklist
              name="investigations"
              param={namesToParams.Investigations}
              facets={getFacets('Investigations')}
              onChange={onChange}
            />
          </SearchFilterSection>
        )
      }
      {
        getFacets('Instruments').length > 0 && (
          <SearchFilterSection title="Instruments" eventKey="3" setSidebarOpened={setSidebarOpened}>
            <FacetChecklist
              name="instruments"
              param={namesToParams.Instruments}
              facets={getFacets('Instruments')}
              onChange={onChange}
            />
          </SearchFilterSection>
        )
      }
      {
        getFacets('Targets').length > 0 && (
          <SearchFilterSection title="Targets" eventKey="4" setSidebarOpened={setSidebarOpened}>
            <FacetChecklist
              name="targets"
              param={namesToParams.Instruments}
              facets={getFacets('Targets')}
              onChange={onChange}
            />
          </SearchFilterSection>
        )
      }
      {
        getFacets('Keywords').length > 0 && (
          <SearchFilterSection title="Topics" eventKey="5" setSidebarOpened={setSidebarOpened}>
            <FacetChecklist
              name="topics"
              param={namesToParams.Keywords}
              facets={getFacets('Keywords')}
              onChange={onChange}
            />
          </SearchFilterSection>
        )
      }
      {
        getFacets('Platforms').length > 0 && (
          <SearchFilterSection title="Observation Method" eventKey="6" setSidebarOpened={setSidebarOpened}>
            <FacetChecklist
              name="observation methods"
              facets={getFacets('Platforms')}
              param={namesToParams.Platforms}
              onChange={onChange}
              humanize={(name) => name.replace(' Platforms', '')}
            />
          </SearchFilterSection>
        )
      }

      { /* Accordion.Item "Center" (No equivalent CMR field/facet. Requested CMR-9874) */ }
      { /* Accordion.Item "Date" (No equivalent. Probably won't do.) */ }
    </SearchFilterSectionList>
  )
}

export default SearchFilters
