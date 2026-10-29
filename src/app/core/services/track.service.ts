import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Track } from '../models/track';
import { Lesson } from '../models/lesson';
import { LessonContent } from '../models/LessonContent';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class TrackService {

  private apiUrl = 'https://localhost:7109/api/Track';

  constructor(private http: HttpClient) {}

  getTracks(): Observable<Track[]> {
    return this.http.get<Track[]>(this.apiUrl);
  }

  getLessonsByTrack(trackId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(
      `${this.apiUrl.replace('/Track', '/Lesson')}/Track/${trackId}`
    );
  }
  getInteractiveActivitiesByTrack(trackId: number): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl.replace('/Track', '/InteractiveActivity')}/Track/${trackId}`
  );
}

getWorkshopsByTrack(trackId: number): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl.replace('/Track', '/Workshop')}/Track/${trackId}`
  );
}

getBookingPrice(
  trackId: number,
  bookingType: number
): Observable<{ price: number }> {
  return this.http.get<{ price: number }>(
    `https://localhost:7109/api/TrackBooking/price/${trackId}/${bookingType}`,
    { withCredentials: true }
  );
}

getLesson(lessonId: number): Observable<Lesson> {
  return this.http.get<Lesson>(
    `https://localhost:7109/api/Lesson/${lessonId}`,
    { withCredentials: true }
  );
}

getLessonContents(lessonId: number): Observable<LessonContent[]> {
  return this.http.get<LessonContent[]>(
    `https://localhost:7109/api/LessonContent/lesson/${lessonId}`,
    { withCredentials: true }
  );
}

getMyTracks() {
  return this.http.get<any[]>(
    `${this.apiUrl}/my-tracks`,
    { withCredentials: true }
  );
}
bookTrack(
  trackId: number,
  bookingType: number
): Observable<{ message: string; price: number }> {
  return this.http.post<{ message: string; price: number }>(
    'https://localhost:7109/api/TrackBooking',
    {
      trackId: trackId,
      bookingType: bookingType
    },
    { withCredentials: true }
  );
}
getStudentLessonsByTrack(trackId: number): Observable<Lesson[]> {
  return this.http.get<Lesson[]>(
    `https://localhost:7109/api/Lesson/Track/${trackId}/student`,
    { withCredentials: true }
  );
}

getInteractiveSchedulesByTrack(trackId: number): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl.replace('/Track', '/InteractiveActivity')}/Track/${trackId}/Schedules`
  );
}

getMyBookings() {
  return this.http.get<any[]>(
    'https://localhost:7109/api/TrackBooking/MyBookings',
    { withCredentials: true }
  );
}


}
