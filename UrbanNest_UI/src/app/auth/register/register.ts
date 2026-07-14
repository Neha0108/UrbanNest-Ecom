import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { UserService } from '../../service/user-service';
import { User } from '../../interface/user';
import { gstNumberValidator, panNumberValidator, contactNumberValidator, passwordStrengthValidator, nameValidator } from '../../validators/custom-validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {

  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private chng = inject(ChangeDetectorRef);

  userform!: FormGroup;
  retailerForm!: FormGroup;

  otpSent = false;
  otpVerified = false;
  otp: string = '';
  otpArray: string[] = ['', '', '', '', '', ''];

  countdown: number = 0;
  resendDisabled = false;

  //  ERROR MESSAGES (replacing alerts)
  errorMessage = '';
  successMessage = '';
  otpError = '';
  otpSuccess = '';

  //  FIXED ROLES
  roles = [
    { name: 'Consumer' },
    { name: 'Retailer' }
  ];

  isRetailer = false;
  step = 1;

  startTimer() {
    this.countdown = 30;
    this.resendDisabled = true;

    const interval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        this.resendDisabled = false;
        clearInterval(interval);
      }
    }, 1000);
  }

  ngOnInit(): void {

    //  USER FORM
    this.userform = this.fb.group({
      UserName: ['', [Validators.required, nameValidator()]],
      UserEmail: ['', [Validators.required, Validators.email]],
      UserPassword: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
      ConfirmPassword: ['', Validators.required],   // ✅ ADD THIS
      Roles: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });  // ✅ ADD THIS

    //  RETAILER FORM
    this.retailerForm = this.fb.group({
      shopName: ['', [Validators.required, Validators.minLength(3)]],
      gstNumber: ['', [Validators.required, gstNumberValidator()]],
      panNumber: ['', [Validators.required, panNumberValidator()]],
      contactNumber: ['', [Validators.required, contactNumberValidator()]],
      address: ['', [Validators.required, Validators.minLength(5)]]
    });

    //  ROLE CHANGE DETECTION
    this.userform.get('Roles')?.valueChanges.subscribe(role => {
      this.isRetailer = role === 'Retailer';

      if (!this.isRetailer) {
        this.step = 1;
      }
    });
  }

  sendOtp() {
    this.errorMessage = '';
    this.otpError = '';

    if (this.userform.get('UserEmail')?.invalid) {
      this.errorMessage = 'Please enter a valid email first';
      return;
    }

    const email = this.userform.value.UserEmail;

    this.userService.sendOtp(email).subscribe({
      next: () => {
        this.otpSent = true;
        this.startTimer();
        this.otpSuccess = 'OTP sent successfully to your email ';
        setTimeout(() => this.otpSuccess = '', 3000);
        this.chng.detectChanges();  // Force change detection to update the view
      },
      error: (err) => {
        this.otpError = err?.error?.message || 'Failed to send OTP. Please try again.';
      }
    });
  }

  verifyOtp() {
    if (this.otpVerified) return;   // ✅ BLOCK DOUBLE CALL

    this.otpError = '';

    if (this.otpArray.includes('')) {
      this.otpError = 'Please enter all 6 digits of the OTP';
      return;
    }

    const data = {
      email: this.userform.value.UserEmail,
      otp: this.otpArray.join('')
    };

    this.userService.verifyOtp(data).subscribe({
      next: () => {
        this.otpVerified = true;
        this.otpSuccess = 'OTP verified successfully ✅';
        this.chng.detectChanges();  // Force change detection to update the view
      },
      error: (err) => {
        console.log("VERIFY ERROR:", err);
        this.otpError = 'Invalid or expired OTP. Please try again.';
      }
    });
  }
  moveNext(event: any, index: number) {
    const input = event.target;

    if (input.value && index < 5) {
      const next = input.nextElementSibling;
      if (next) next.focus();
    }
  }

  resendOtp() {
    this.otpError = '';
    const email = this.userform.value.UserEmail;

    this.userService.resendOtp(email).subscribe({
      next: () => {
        this.startTimer();
        this.otpSuccess = 'OTP resent successfully ';
        setTimeout(() => this.otpSuccess = '', 2000);
        this.chng.detectChanges();
      },
      error: (err) => this.otpError = err?.error?.message || 'Failed to resend OTP'
    });
  }

  //  NEXT STEP
  goToRetailerForm() {
    this.errorMessage = '';

    if (this.userform.invalid) {
      this.errorMessage = 'Please fill all user details correctly before proceeding';
      return;
    }

    this.step = 2;
  }


  //  FINAL SUBMIT (SINGLE API)
  submit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isRetailer && this.step === 1) return;
    if (this.userform.invalid) {
      this.errorMessage = 'Please fill all required user details correctly';
      return;
    }

    const user = {
      UserName: this.userform.value.UserName,
      UserEmail: this.userform.value.UserEmail,
      UserPassword: this.userform.value.UserPassword,
      Roles: this.userform.value.Roles
    };

    let finalData: any = user;

    //  IF RETAILER → ADD EXTRA DATA
    if (this.isRetailer) {

      if (this.retailerForm.invalid) {
        this.errorMessage = 'Please fill all retailer details correctly';
        return;
      }

      finalData = {
        ...user,
        ...this.retailerForm.value
      };
    }

    //  SINGLE API CALL
    this.userService.registerUser(finalData as User).subscribe({
      next: () => {
        this.successMessage = this.isRetailer ? 'Retailer registered successfully ' : 'User registered successfully ';
        setTimeout(() => {
          this.router.navigate(['']);
        }, 4000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
  passwordMatchValidator(form: FormGroup) {
    const pass = form.get('UserPassword')?.value;
    const confirm = form.get('ConfirmPassword')?.value;

    return pass === confirm ? null : { mismatch: true };
  }
}