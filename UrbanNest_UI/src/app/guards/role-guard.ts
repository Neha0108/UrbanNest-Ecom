import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../service/user-service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const userService = inject(UserService);
    const router = inject(Router);

    if (!userService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    const role = userService.getUserRole();

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    router.navigate(['/login']);
    return false;
  };
};