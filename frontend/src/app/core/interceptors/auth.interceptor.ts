import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip token for auth endpoints
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const token = authService.getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Token expired, try to refresh
        const refreshToken = authService.getRefreshToken();

        if (refreshToken) {
          return authService.refreshToken(refreshToken).pipe(
            switchMap((response) => {
              // Retry the request with new token
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.access}`
                }
              });
              return next(newReq);
            }),
            catchError((refreshError) => {
              // Refresh failed, logout and redirect
              authService.logout();
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token, logout and redirect
          authService.logout();
          router.navigate(['/auth/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
