import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../service/user-service';
import { Google } from '../../service/google';
import { environment } from '../../../env/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements  AfterViewInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private googleService = inject(Google);

  errorMessage = '';

  loginForm = this.fb.group({
    UserEmail: ['', [Validators.required, Validators.email]],
    UserPassword: ['', Validators.required],
  });

 ngAfterViewInit(): void {
  this.googleService.initialize(
    environment.googleClientId,
    (idToken: string) => {
      this.handleGoogleLogin(idToken);
    }
  );

  this.googleService.renderButton('googleButton');
}

  private getUserRoleFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (payload.role) return payload.role;
      if (payload.Role) return payload.Role;

      const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      if (Array.isArray(roleClaim)) return roleClaim[0];
      if (typeof roleClaim === 'string') return roleClaim;

      return null;
    } catch {
      return null;
    }
  }

  private redirectByRole(token: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('role', this.getUserRoleFromToken(token) || '');

    const role = this.getUserRoleFromToken(token);

    if (role === 'Retailer') {
      this.router.navigateByUrl('/retailerNavbar/retailerdashboard', { replaceUrl: true });
    } else if (role === 'Consumer') {
      this.router.navigateByUrl('/consumerNavbar/home', { replaceUrl: true });
    } else if (role === 'Admin') {
      this.router.navigate(['/admin']);
    } else {
      localStorage.clear();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  private handleGoogleLogin(idToken: string): void {
    this.userService.googleLogin(idToken).subscribe({
      next: (response) => {
        this.redirectByRole(response.token);
      },
      error: () => {
        this.errorMessage = 'Google sign-in failed. Please try again.';
      },
    });
  }

  submit(): void {
    if (this.loginForm.invalid) return;

    const { UserEmail, UserPassword } = this.loginForm.value as {
      UserEmail: string;
      UserPassword: string;
    };

    this.userService.loginUser(UserEmail, UserPassword).subscribe({
      next: (response) => {
        this.redirectByRole(response.token);
      },
      error: () => {
        this.errorMessage = 'Invalid email or password';
      },
    });
  }
}
