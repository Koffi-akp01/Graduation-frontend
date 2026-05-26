import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth/auth';

export const roleGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const userRole = authService.currentUser()?.role ?? localStorage.getItem('user_role') ?? '';

  // Supporte data.roles (tableau) ou data.role (string unique, rétrocompatibilité)
  const allowed: string[] = route.data['roles'] ?? (route.data['role'] ? [route.data['role']] : []);

  if (allowed.length === 0 || allowed.includes(userRole)) {
    return true;
  }

  // Rôle non autorisé → rediriger vers la page d'accueil du bon rôle
  authService.redirectByRole(userRole);
  return false;
};
