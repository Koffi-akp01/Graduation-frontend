import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { ToastService } from '../../shared/services/toast';
import { AuthService } from '../services/auth/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toast = inject(ToastService);
  const token = authService.getToken();

  let authReq = req;

  if (token) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(authReq, next, authService, toast);
      }

      if (error instanceof HttpErrorResponse && error.status === 403) {
        toast.error('Acces refuse.');
      } else if (error instanceof HttpErrorResponse && error.status === 404) {
        toast.warning('Ressource introuvable.');
      } else if (error instanceof HttpErrorResponse && error.status >= 500) {
        toast.error('Erreur serveur. Reessayez plus tard.');
      }

      return throwError(() => error);
    })
  );
};

function addTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  toast: ToastService
) {
  return authService.refreshToken().pipe(
    switchMap((response: any) => next(addTokenHeader(request, response.access))),
    catchError((err) => {
      toast.error('Session expiree. Reconnectez-vous.');
      authService.logout();
      return throwError(() => err);
    })
  );
}
