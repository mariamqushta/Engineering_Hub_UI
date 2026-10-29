export interface Workshop {
  id: number;
  trackId: number;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  capacity: number;
  availableCapacity?: number;
  price: number;
  status: number;
}
