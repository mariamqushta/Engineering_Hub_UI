import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError
} from 'rxjs';

import { environment } from '../../../environments/environment';

const API_URL = `${environment.apiUrl}/Account`;

let isRefreshing = false;
const refreshResult = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const request = req.clone({ withCredentials: true });

  return next(request).pipe(
    catchError(error => {
      const isRefreshRequest = req.url === `${API_URL}/refresh`;
      const isLogoutRequest = req.url === `${API_URL}/logout`;
      const isRegisterRequest = req.url === `${API_URL}/Register`;
      const isLoginRequest = req.url === API_URL;

      if (
        error.status !== 401 ||
        isRefreshRequest ||
        isLogoutRequest ||
        isRegisterRequest ||
        isLoginRequest
      ) {
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshResult.next(null);

        return http.post(
          `${API_URL}/refresh`,
          {},
          { withCredentials: true }
        ).pipe(
          switchMap(() => {
            isRefreshing = false;
            refreshResult.next(true);
            return next(request);
          }),
          catchError(refreshError => {
            isRefreshing = false;
            refreshResult.next(false);
            return throwError(() => refreshError);
          })
        );
      }

      return refreshResult.pipe(
        filter(result => result !== null),
        take(1),
        switchMap(success => {
          if (success) {
            return next(request);
          }

          return throwError(() => error);
        })
      );
    })
  );
};
