import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Consumer } from '../../../service/consumer';
import { UserService } from '../../../service/user-service';
import { environment } from '../../../../env/environment';
import { ConsumerProfile } from '../../../interface/consumer-profile';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '360ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('bannerIn', [
      transition(':enter', [
        style({ opacity: 0, height: 0, marginBottom: 0 }),
        animate(
          '260ms ease',
          style({ opacity: 1, height: '*', marginBottom: '20px' })
        ),
      ]),
      transition(':leave', [
        animate('200ms ease', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class Profile implements OnInit {
  private consumerService = inject(Consumer);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  private readonly imageHost = environment.apiUrl.replace(/\/api\/?$/, '');

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly userName = signal<string>('');
  readonly userEmail = signal<string>('');

  readonly existingImagePath = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);
  private selectedFile: File | null = null;

  readonly avatarSrc = computed(() => {
    if (this.previewUrl()) return this.previewUrl();
    const path = this.existingImagePath();
    return path ? `${this.imageHost}${path}` : null;
  });

  readonly initials = computed(() => {
    const f = this.form?.get('firstName')?.value ?? '';
    const l = this.form?.get('lastName')?.value ?? '';
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || this.userName().charAt(0).toUpperCase();
  });

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(1)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    gender: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadProfile();
  }

  private loadUserInfo(): void {
    this.userService.getUserInfo().subscribe({
      next: (res: any) => {
        this.userName.set(res?.userName ?? '');
        this.userEmail.set(res?.userEmail ?? '');
      },
      error: () => { },
    });
  }

  private loadProfile(): void {
    this.loading.set(true);

    this.consumerService.getProfile().subscribe({
      next: (res: ConsumerProfile) => {

        console.log('Profile Response:', res);

        this.form.patchValue({
          firstName: res?.firstName ?? '',
          lastName: res?.lastName ?? '',
          phone: res?.phone ?? '',
          gender: res?.gender ?? '',
          dateOfBirth: res?.date_of_Birth
            ? res.date_of_Birth.substring(0, 10)
            : '',
        });

        this.existingImagePath.set(res?.profileimage ?? null);

        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please choose a valid image file.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      this.errorMessage.set('Image must be under 4MB.');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removePreview(): void {
    this.previewUrl.set(null);
    this.selectedFile = null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const value = this.form.value;
    const formData = new FormData();
    formData.append('FirstName', value.firstName);
    formData.append('LastName', value.lastName);
    formData.append('Phone', value.phone);
    formData.append('Gender', value.gender);
    formData.append('Date_of_Birth', value.dateOfBirth);
    if (this.selectedFile) {
      formData.append('profileimage', this.selectedFile);
    }

    this.consumerService.EditProfile(formData).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('Profile updated successfully.');
        this.selectedFile = null;
        this.loadProfile();
        setTimeout(() => this.successMessage.set(null), 3500);
      },
      error: (err) => {
        console.error(err);
        this.saving.set(false);
        this.errorMessage.set('Something went wrong while saving. Please try again.');
      },
    });
  }

  get f() {
    return this.form.controls;
  }
}