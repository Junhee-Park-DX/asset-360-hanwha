export type PanelState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'no-access' }
  | { status: 'error'; message: string };
