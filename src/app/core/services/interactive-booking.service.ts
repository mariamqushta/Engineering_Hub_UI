import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface InteractiveBookingResponse {
  message: string;
}

export interface MyInteractiveBooking {
  bookingId: number;
  interactiveActivityId: number;
  bookedAt: string;
  bookingStatus: number | string;
  approvalStatus: number | string;
  interactiveActivity?: {
    id: number;
    title?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class InteractiveBookingService {
  private readonly apiUrl =
    `${environment.apiUrl}/InteractiveBooking`;

  constructor(private http: HttpClient) {}

  bookActivity(
    interactiveActivityId: number
  ): Observable<InteractiveBookingResponse> {
    return this.http.post<InteractiveBookingResponse>(
      this.apiUrl,
      { interactiveActivityId },
      { withCredentials: true }
    );
  }

  getMyBookings(): Observable<MyInteractiveBooking[]> {
    return this.http.get<MyInteractiveBooking[]>(
      `${this.apiUrl}/MyBookings`,
      { withCredentials: true }
    );
  }
}
