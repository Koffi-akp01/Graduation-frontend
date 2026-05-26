import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

import { ToastService } from '../../shared/services/toast';
import { AuthService } from '../services/auth/auth';

// Module-level state — partagé entre toutes les instances de l'interceptor
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toast       = inject(ToastService);

  // Les endpoints d'auth ne portent pas de Bearer token et ne doivent jamais être retentés
  if (/\/auth\/(token|register)/.test(req.url)) {
    return next(req);
  }

  const token = authService.getToken();
  const authReq = token ? withToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return handle401(authReq, next, authService, toast);
      }
      if (err.status === 403) {
        toast.error('Accès refusé.');
      } else if (err.status >= 500) {
        toast.error('Erreur serveur. Réessayez plus tard.');
      }
      return throwError(() => err);
    })
  );
};

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  toast: ToastService,
) {
  if (!isRefreshing) {
    // Premier 401 : lancer le refresh et broadcaster le nouveau token
    isRefreshing = true;
    refreshSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((res: { access: string }) => {
        isRefreshing = false;
        refreshSubject.next(res.access);
        return next(withToken(req, res.access));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshSubject.next(null);
        toast.error('Session expirée. Reconnectez-vous.');
        authService.logout();
        return throwError(() => err);
      }),
    );
  }

  // Refresh déjà en cours : attendre le nouveau token puis retenter
  return refreshSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap(token => next(withToken(req, token))),
  );
}
