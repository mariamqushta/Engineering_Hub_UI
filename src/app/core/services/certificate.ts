
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface Certificate {
  id: number;
  trackId: number;
  issuedAt: string;
  certificateUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private readonly apiUrl = `${environment.apiUrl}/api/Certificate`;

  constructor(private http: HttpClient) {}

  getMyCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(
      `${this.apiUrl}/my-certificates`,
      { withCredentials: true }
    );
  }

  getCertificateById(id: number): Observable<Certificate> {
    return this.http.get<Certificate>(
      `${this.apiUrl}/${id}`,
      { withCredentials: true }
    );
  }

  isTrackCompleted(trackId: number): Observable<{ isCompleted: boolean }> {
    return this.http.get<{ isCompleted: boolean }>(
      `${this.apiUrl}/track/${trackId}/completion-status`,
      { withCredentials: true }
    );
  }

  downloadCertificate(id: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${id}/download`,
      {
        withCredentials: true,
        responseType: 'blob'
      }
    );
  }
}
