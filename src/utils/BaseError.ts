export type Jsonable =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly Jsonable[]
  | { readonly [key: string]: Jsonable }
  | { toJSON(): Jsonable };

export class BaseError extends Error {
  public readonly context?: Jsonable;

  constructor(
    message: string,
    options: {
      cause?: unknown;
      context?: Jsonable;
    } = {},
  ) {
    super(message, options);

    this.name = this.constructor.name;
    this.context = options.context;
  }
}
