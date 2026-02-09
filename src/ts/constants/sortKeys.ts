/**
 * The default sort key used for sorting collections is '-score'
 * ('Relevance' is the display label for that).
 */
export const defaultSortKey = '-score'

/**
 * An array of objects representing the available sort keys for collections.
 * Each object contains a `key` which is used for sorting and a `value` which is the display name.
 */
export const collectionSortKeys = [
  {
    key: '-score',
    value: 'Relevance'
  }
]
