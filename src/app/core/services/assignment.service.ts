import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private readonly apiUrl = 'https://localhost:7109/api/Assignment';
  private readonly requestTimeout = 15000;

  constructor(private http: HttpClient) {}

  getLessonAssignments(lessonId: number): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/lesson/${lessonId}`, {
        withCredentials: true
      })
      .pipe(
        timeout(this.requestTimeout),
        catchError(error => {
          console.error('Failed to load assignments:', error);
          return of([]);
        })
      );
  }

  getMySubmission(assignmentId: number): Observable<any | null> {
    return this.http
      .get<any>(`${this.apiUrl}/${assignmentId}/my-submission`, {
        withCredentials: true
      })
      .pipe(
        timeout(this.requestTimeout),
        catchError(error => {
          if (error.status !== 404) {
            console.error(
              `Failed to load submission for assignment ${assignmentId}:`,
              error
            );
          }

          return of(null);
        })
      );
  }

  getInstructorAssignments(lessonId: number): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/instructor/lesson/${lessonId}`, {
        withCredentials: true
      })
      .pipe(
        timeout(this.requestTimeout),
        catchError(error => {
          console.error('Failed to load instructor assignments:', error);
          return of([]);
        })
      );
  }

  getSubmissions(assignmentId: number): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/${assignmentId}/submissions`, {
        withCredentials: true
      })
      .pipe(
        timeout(this.requestTimeout),
        catchError(error => {
          console.error('Failed to load assignment submissions:', error);
          return of([]);
        })
      );
  }
}
