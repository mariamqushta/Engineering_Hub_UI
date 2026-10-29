
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CalendarEvent {
  id: number;
  title: string;
  eventType: 'Workshop' | 'Interactive';
  trackId: number;
  trackTitle: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7109/api/Calendar';

  getInstructorCalendar(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(
      `${this.apiUrl}/instructor/my-calendar`,
      { withCredentials: true }
    );
  }

  getStudentCalendar(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(
      `${this.apiUrl}/student/my-calendar`,
      { withCredentials: true }
    );
  }
}
