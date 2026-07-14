import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');

  if (!token) {
    return true;
  }

  switch (role) {
    case 'Consumer':
      router.navigate(['/consumerNavbar/home']);
      break;

    case 'Retailer':
      router.navigate(['/retailerNavbar/retailerdashboard']);
      break;

    case 'Admin':
      router.navigate(['/admin']);
      break;

    default:
      localStorage.clear();
      sessionStorage.clear();
      router.navigate(['/login']);
  }

  return false;
};