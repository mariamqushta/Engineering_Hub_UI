import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/Account`;

  constructor(private http: HttpClient) {}

register(data: {
  userName: string;
  password: string;
  fullName: string;
  role: string;
}): Observable<any> {

  return this.http.post(
    `${this.apiUrl}/Register`,
    data,
    {
      withCredentials: true,
      responseType: 'text'
    }
  );
}
  login(data: {
  userName: string;
  password: string;
}): Observable<any> {

  return this.http.post(
    this.apiUrl,
    data,
    {
      withCredentials: true
    }
  );
}

getCurrentUser(): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/me`,
    {
      withCredentials: true
    }
  );
}

logout(): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/logout`,
    {},
    {
      withCredentials: true
    }
  );
}


updateProfile(data: FormData): Observable<any> {
  return this.http.put(`${this.apiUrl}/profile`, data, {
    withCredentials: true,
  });
}

private profileImageSubject = new BehaviorSubject<string | null>(null);
profileImage$ = this.profileImageSubject.asObservable();

updateProfileImage(imageUrl: string | null): void {
  this.profileImageSubject.next(imageUrl);
}
}
