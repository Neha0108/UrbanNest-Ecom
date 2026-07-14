import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Retailer } from '../../../interface/retailer';
import { Retailer as RetailerService } from '../../../service/retailer';

@Component({
  selector: 'app-retailer-profile',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private rservice = inject(RetailerService);
  private chng = inject(ChangeDetectorRef);

  form!: FormGroup;
  retailerProfile!: Retailer;

  loading = false;
  errorMessage = '';
  successMessage = '';
  activeSection:
  'shop'
  | 'address'
  | 'contact'
  | 'business'
  | 'bank' = 'shop';

  ngOnInit() {
    this.form = this.fb.group({
      ShopName: [''],
      ShopDescription: [''],
      Address: [''],
      City: [''],
      State: [''],
      Pincode: [''],
      ContactNumber: [''],
      Email: [''],
      GSTNumber: [''],
      PANNumber: [''],
      BankAccountNumber: [''],
      IFSCCode: [''],
      AccountHolderName: [''],
    });

    this.loadProfile();
  }

  // ✅ LOAD PROFILE
  loadProfile() {
    this.loading = true;
    this.errorMessage = '';

    this.rservice.getProfile().subscribe({
      next: (res: any) => {
        this.retailerProfile = res;
        this.chng.detectChanges();

        // ✅ mapping (because backend sends camelCase)
        this.form.patchValue({
          ShopName: res.ShopName,
          ShopDescription: res.ShopDescription,
          Address: res.Address,
          City: res.City,
          State: res.State,
          Pincode: res.Pincode,
          ContactNumber: res.ContactNumber,
          Email: res.Email,
          GSTNumber: res.GSTNumber,
          PANNumber: res.PANNumber,
          BankAccountNumber: res.BankAccountNumber,
          IFSCCode: res.IFSCCode,
          AccountHolderName: res.AccountHolderName,
        });

        this.loading = false;
        console.log(res);
        this.chng.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load profile';
        this.loading = false;
      },
    });
  }

  // ✅ UPDATE PROFILE
  update() {
    this.errorMessage = '';
    this.successMessage = '';

    this.rservice.updateProfile(this.form.value).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully ✅';
        alert("your profile is updated");
        this.chng.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Update failed ❌';
      },
    });
  }
  get profileCompletion(): number {

  if (!this.form) return 0;

  const controls = Object.values(this.form.controls);

  const filled = controls.filter(control => {
    const value = control.value;
    return value !== null &&
           value !== undefined &&
           value.toString().trim() !== '';
  });

  return Math.round((filled.length / controls.length) * 100);
}

get shopInitial(): string {

  return this.form.get('ShopName')?.value
    ? this.form.get('ShopName')?.value.charAt(0).toUpperCase()
    : 'S';

}
scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}
}