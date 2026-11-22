export interface PageMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/** Envelope for every list endpoint. */
export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}
