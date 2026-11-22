/** A reporting window resolved to instants: [from, to). */
export interface Period {
  fromDate: string;
  toDate: string;
  timeZone: string;
  from: Date;
  to: Date;
}

/** One row of the daily trend query (counts already cast to int by SQL). */
export interface TrendRow {
  day: string;
  transactions: number;
  matched: number;
  excluded: number;
  exceptionsOpened: number;
  exceptionsClosed: number;
}
