import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError, switchMap } from 'rxjs';
import { ToastService } from '../../shared/services/toast';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const token = auth.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        toast.error('Session expirée. Reconnectez-vous.');
      } else if (err.status === 403) {
        toast.error('Accès refusé.');
      } else if (err.status === 404) {
        toast.warning('Ressource introuvable.');
      } else if (err.status >= 500) {
        toast.error('Erreur serveur. Réessayez plus tard.');
      }
      return throwError(() => err);
    })
  );
};