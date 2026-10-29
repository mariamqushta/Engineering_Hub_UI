import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface WorkshopBookingResponse {
  bookingId: number;
  workshopId: number;
  bookedAt: string;
  bookingStatus: number;
  approvalStatus: number;
  workshop: {
    id: number;
    trackId: number;
    title: string;
    description: string | null;
    place: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
    availableCapacity: number;
    status: number;
    price: number;
  };
}

interface WorkshopBookingResult {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkshopBookingService {
  private readonly apiUrl =
    `${environment.apiUrl}/WorkshopBooking`;

  constructor(private http: HttpClient) {}

  bookWorkshop(
    workshopId: number
  ): Observable<WorkshopBookingResult> {
    return this.http.post<WorkshopBookingResult>(
      this.apiUrl,
      { workshopId },
      { withCredentials: true }
    );
  }

  getMyBookings(): Observable<WorkshopBookingResponse[]> {
    return this.http.get<WorkshopBookingResponse[]>(
      `${this.apiUrl}/MyBookings`,
      { withCredentials: true }
    );
  }
}
