import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Consumer } from '../../../service/consumer';
import { Address as AddressModel } from '../../../interface/address';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger
} from '@angular/animations';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './address.html',
  styleUrl: './address.css',
  animations: [
    trigger('listStagger', [
      transition(':enter', [
        query(
          '.address-card',
          [
            style({ opacity: 0, transform: 'translateY(12px)' }),
            stagger(60, [
              animate(
                '360ms cubic-bezier(0.16,1,0.3,1)',
                style({
                  opacity: 1,
                  transform: 'translateY(0)'
                })
              )
            ])
          ],
          { optional: true }
        )
      ])
    ]),

    trigger('panelSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate(
          '340ms cubic-bezier(0.16,1,0.3,1)',
          style({ transform: 'translateX(0)' })
        )
      ]),
      transition(':leave', [
        animate(
          '260ms cubic-bezier(0.4,0,1,1)',
          style({ transform: 'translateX(100%)' })
        )
      ])
    ]),

    trigger('overlayFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('260ms ease', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('220ms ease', style({ opacity: 0 }))
      ])
    ]),

    trigger('bannerIn', [
      transition(':enter', [
        style({ opacity: 0, height: 0, marginBottom: 0 }),
        animate(
          '260ms ease',
          style({
            opacity: 1,
            height: '*',
            marginBottom: '20px'
          })
        )
      ]),
      transition(':leave', [
        animate('200ms ease', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class Address implements OnInit {

  private consumerService = inject(Consumer);
  private fb = inject(FormBuilder);

  readonly addresses = signal<AddressModel[]>([]);
  readonly loading = signal(true);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly deletingId = signal<number | null>(null);

  readonly locating = signal(false);
  readonly locationCaptured = signal(false);
  readonly locationError = signal<string | null>(null);

  editingAddressId: number | null = null;

  readonly hasAddresses = computed(
    () => this.addresses().length > 0
  );

  readonly sortedAddresses = computed(() =>
    [...this.addresses()].sort(
      (a, b) => Number(b.isDefault) - Number(a.isDefault)
    )
  );

  readonly form: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]
    ],
    addressLine: [
      '',
      [
        Validators.required,
        Validators.minLength(5)
      ]
    ],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{6}$/)
      ]
    ],
    isDefault: [false],
    latitude: [null],
    longitude: [null]
  });

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {

    this.loading.set(true);
    this.errorMessage.set(null);

    this.consumerService.getAddresses().subscribe({
      next: (res: AddressModel[]) => {

        this.addresses.set(res ?? []);
        this.loading.set(false);

      },
      error: (err) => {

        console.error(err);

        this.errorMessage.set(
          'We couldn’t load your addresses. Please refresh.'
        );

        this.loading.set(false);
      }
    });
  }

  openForm(): void {

    this.editingAddressId = null;

    this.form.reset({
      isDefault: this.addresses().length === 0
    });

    this.locationCaptured.set(false);
    this.locationError.set(null);

    this.showForm.set(true);
  }

  editAddress(address: AddressModel): void {

    this.editingAddressId = address.addressId ?? null;

    this.form.patchValue({
      fullName: address.fullName,
      phone: address.phone,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
      latitude: address.latitude,
      longitude: address.longitude
    });

    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  useCurrentLocation(): void {

    if (!navigator.geolocation) {

      this.locationError.set(
        'Geolocation is not supported on this device.'
      );

      return;
    }

    this.locating.set(true);
    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(

      (position) => {

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        this.form.patchValue({
          latitude,
          longitude
        });

        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        )
          .then(res => res.json())
          .then(data => {

            const address = data.address || {};

            this.form.patchValue({

              addressLine:
                data.display_name ?? '',

              city:
                address.city ??
                address.town ??
                address.village ??
                '',

              state:
                address.state ?? '',

              pincode:
                address.postcode ?? ''
            });

            this.locationCaptured.set(true);
            this.locating.set(false);

          })
          .catch(() => {

            this.locationError.set(
              'Location captured but address could not be fetched.'
            );

            this.locating.set(false);
          });

      },

      () => {

        this.locationError.set(
          'Unable to access your current location.'
        );

        this.locating.set(false);

      },

      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  saveAddress(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const value = this.form.value;

    const payload: AddressModel = {

      fullName: value.fullName,
      phone: value.phone,
      addressLine: value.addressLine,
      city: value.city,
      state: value.state,
      pincode: value.pincode,
      isDefault: value.isDefault,
      latitude: value.latitude,
      longitude: value.longitude
    };

    if (this.editingAddressId) {

      this.consumerService.updateAddress(this.editingAddressId, payload)
        .subscribe({

          next: () => {

            this.saving.set(false);
            this.showForm.set(false);

            this.successMessage.set(
              'Address updated successfully.'
            );

            this.loadAddresses();

            setTimeout(() => {
              this.successMessage.set(null);
            }, 3500);
          },

          error: (err) => {

            console.error(err);

            this.saving.set(false);

            this.errorMessage.set(
              'Couldn’t update address.'
            );
          }
        });

      return;
    }

    this.consumerService
      .addAddress(payload)
      .subscribe({

        next: () => {

          this.saving.set(false);
          this.showForm.set(false);

          this.successMessage.set(
            'Address saved successfully.'
          );

          this.loadAddresses();

          setTimeout(() => {
            this.successMessage.set(null);
          }, 3500);
        },

        error: (err) => {

          console.error(err);

          this.saving.set(false);

          this.errorMessage.set(
            'Couldn’t save this address. Please try again.'
          );
        }
      });
  }

  deleteAddress(address: AddressModel): void {

    if (!address.addressId) return;

    if (
      !confirm('Remove this address from your account?')
    ) {
      return;
    }

    this.deletingId.set(address.addressId);

    this.consumerService
      .deleteAddress(address.addressId)
      .subscribe({

        next: () => {

          this.addresses.update(list =>
            list.filter(
              a => a.addressId !== address.addressId
            )
          );

          this.deletingId.set(null);
        },

        error: (err) => {

          console.error(err);

          this.deletingId.set(null);

          alert(
            'Couldn’t remove this address. Please try again.'
          );
        }
      });
  }

  get f() {
    return this.form.controls;
  }
}