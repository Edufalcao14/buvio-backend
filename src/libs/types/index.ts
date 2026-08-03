export type WithRequired<T, K extends keyof T> = Partial<T> &
  Required<Pick<T, K>>;

export type WithRequiredMany<T, K extends (keyof T)[]> = Partial<T> &
  Required<Pick<T, Extract<keyof T, K[number]>>>;
