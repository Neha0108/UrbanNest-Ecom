import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates GST Number format (Indian GST - 15 characters)
 * Format: 2 digits (state) + 10 digits (PAN-based) + 1 digit + 1 digit = 15 total
 */
export function gstNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const isValid = gstPattern.test(control.value.toUpperCase());

    return isValid ? null : { 'invalidGst': true };
  };
}

/**
 * Validates PAN Number format (Indian PAN - 10 characters)
 * Format: AAAAA9999A (5 letters, 4 digits, 1 letter)
 */
export function panNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const isValid = panPattern.test(control.value.toUpperCase());

    return isValid ? null : { 'invalidPan': true };
  };
}

/**
 * Validates Contact Number format (Indian mobile - 10 digits)
 */
export function contactNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const contactPattern = /^[6-9]\d{9}$/;
    const isValid = contactPattern.test(control.value.toString());

    return isValid ? null : { 'invalidContact': true };
  };
}

/**
 * Validates password strength
 * Minimum 8 characters, at least one uppercase, one lowercase, one digit, and one special character
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const password = control.value;
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);

    const isValid = minLength && hasUpperCase && hasLowerCase && hasDigit;

    return isValid ? null : { 'weakPassword': true };
  };
}

/**
 * Validates that a field contains only letters and spaces
 */
export function nameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const namePattern = /^[a-zA-Z\s]+$/;
    const isValid = namePattern.test(control.value);

    return isValid ? null : { 'invalidName': true };
  };
}

/**
 * Validates that two form controls match (e.g., password confirmation)
 */
export function matchValuesValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      return null;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ 'mustMatch': true });
      return { 'mustMatch': true };
    } else {
      matchingControl.setErrors(null);
      return null;
    }
  };
}
