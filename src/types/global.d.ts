export interface Facet {
  applied: boolean;
  children?: Facet[];
  count: number;
  hasChildren?: boolean;
  links?: {
    apply?: string;
    remove?: string;
  };
  title: string;
  type: string;
}

export interface Params {
  bounding_box?: string
  keyword?: string
  page_num?: number
  page_size?: number
  processing_level_id_h?: string[]
  science_keywords_h?: string[]
  sort_key?: string
  temporal?: string[] | string
}

type QueryHeaders = Record<string, string> & { 'cmr-hits'?: string }

export interface QueryResult {
  data?: {
    items?: []
  }
  facetData?: {
    feed?: {
      facets?: []
    }
  };
  headers: QueryHeaders;
  message: string;
  query: string;
  status: number;
}
interface PdsCmrParams extends Params{
  page_types: {
    topic: string
  }[]
  investigations: {
    topic: string
  }[]
  instruments: {
    topic: string
  }[]
  targets: {
    topic: string
  }[]
}
