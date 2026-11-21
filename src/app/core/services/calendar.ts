
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CalendarEvent {
  id: number;
  title: string;
  eventType: 'Workshop' | 'Interactive' | 'PrivateAvailability' | 'PrivateSession';
  trackId: number;
  trackTitle: string;
  startDateTime: string;
  endDateTime: string;
  status: string | number;
  studentName?: string | null;
  meetingUrl?: string | null;
}

export interface ScheduleConflictQuery {
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  weekdays?: readonly number[];
}

export function findScheduleConflict(
  events: CalendarEvent[],
  query: ScheduleConflictQuery
): CalendarEvent | undefined {
  const endDate = query.endDate ?? query.startDate;
  const excludedStatuses = new Set([
    '2', '3', '5', '6', 'cancelled', 'canceled',
    'completed', 'finished', 'missed', 'rejected'
  ]);

  return events.find(event => {
    if (event.eventType === 'PrivateAvailability') {
      return false;
    }

    if (excludedStatuses.has(String(event.status).toLowerCase())) {
      return false;
    }

    const eventStart = new Date(event.startDateTime);
    const eventEnd = new Date(event.endDateTime);

    if (
      Number.isNaN(eventStart.getTime()) ||
      Number.isNaN(eventEnd.getTime()) ||
      eventEnd <= eventStart
    ) {
      return false;
    }

    const eventDate = [
      eventStart.getFullYear(),
      String(eventStart.getMonth() + 1).padStart(2, '0'),
      String(eventStart.getDate()).padStart(2, '0')
    ].join('-');

    if (eventDate < query.startDate || eventDate > endDate) {
      return false;
    }

    if (
      query.weekdays &&
      !query.weekdays.includes(eventStart.getDay())
    ) {
      return false;
    }

    const proposedStart = new Date(
      `${eventDate}T${query.startTime}:00`
    );
    const proposedEnd = new Date(
      `${eventDate}T${query.endTime}:00`
    );

    return proposedStart < eventEnd && proposedEnd > eventStart;
  });
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/Calendar`;

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
