export interface InteractiveActivity {
  id: number;
  trackId: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
  capacity: number;
  availableCapacity?: number;
  price: number;
  status: number;
}
