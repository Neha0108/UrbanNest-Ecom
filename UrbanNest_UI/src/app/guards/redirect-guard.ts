import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const redirectGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token');

  const role =
    localStorage.getItem('role') ||
    sessionStorage.getItem('role');

  // User is not logged in
  if (!token) {
    return true;
  }

  // Redirect based on role
  switch (role) {
    case 'Consumer':
      return router.createUrlTree(['/consumerNavbar/home']);

    case 'Retailer':
      return router.createUrlTree(['/retailerNavbar/retailerdashboard']);

    case 'Admin':
      return router.createUrlTree(['/admin']);

    default:
      // Invalid role or stale storage
      localStorage.clear();
      sessionStorage.clear();
      return true;
  }
};