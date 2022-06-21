import type { Room } from '../rooms/models';

export interface Client {
  username: string;
  room: Room | null;
}
