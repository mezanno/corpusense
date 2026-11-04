export enum EventType {
  INFO = 'info',
  ERROR = 'error',
}

export interface Event {
  message: string;
  type: EventType;
}
