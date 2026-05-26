import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth/auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'];
  const userRole = localStorage.getItem('user_role');

  if (authService.isLoggedIn() && userRole === expectedRole) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
