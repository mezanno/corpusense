export enum EventType {
  INFO = 'info',
  ERROR = 'error',
}

export interface Event {
  message: string;
  // time: number;
  type: EventType;
}
