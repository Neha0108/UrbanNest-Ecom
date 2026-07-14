import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Category } from '../../../interface/category';
import { Retailer } from '../../../service/retailer';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.css'],
})
export class AddProduct implements OnInit {

  productForm!: FormGroup;
  categories: Category[] = [];
  subcategories: any[] = [];

  selectedCategoryId: number | null = null;

  selectedImages: File[] = [];
  previewUrls: string[] = [];

  currentImages: string[] = [];

  productId: number | null = null;
  isEdit = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private retailerService: Retailer,
    private route: ActivatedRoute,
    private router: Router,
    private chng: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      productDescription: ['', [Validators.required, Validators.maxLength(150)]],
      CategoryName: ['', Validators.required],
      SubCategoryName: ['', Validators.required],
      productPrice: ['', Validators.required],
      stock: ['', Validators.required],
    });

    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId = +id;
      this.isEdit = true;
      this.loadProduct(this.productId);
    }
  }

  //  LOAD CATEGORIES
loadCategories() {
  this.retailerService.getCategories().subscribe({
    next: (res: Category[]) => {

      this.categories = res;

      if (this.productId) {
        this.loadProduct(this.productId);
      }

      this.chng.detectChanges();
    },
    error: err => console.error(err)
  });
}

  onCategoryChange() {

  const selectedCategoryName =
    this.productForm.get('CategoryName')?.value;

  console.log('Selected Category:', selectedCategoryName);

  const selectedCategory = this.categories.find(
    c => c.categoryName === selectedCategoryName
  );

  console.log('Found Category:', selectedCategory);

  if (!selectedCategory) {
    this.subcategories = [];
    return;
  }

  this.retailerService
    .getSubCategories(selectedCategory.categoryId)
    .subscribe({
      next: (data) => {
        console.log('API Response:', data);

        this.subcategories = data;

        this.productForm.patchValue({
          SubCategoryName: ''
        });
      },
      error: (err) => {
        console.log('API Error:', err);
      }
    });
}

loadProduct(id: number) {
  this.retailerService.getById(id).subscribe(res => {

    this.currentImages = res.imagepath || [];

    this.productForm.patchValue({
      productName: res.productName,
      productDescription: res.productDescription,
      CategoryName: res.categoryName,
      SubCategoryName: res.subCategoryName,
      productPrice: res.productPrice,
      stock: res.stock
    });

    // Find selected category
    const selectedCategory = this.categories.find(
      c => c.categoryName === res.categoryName
    );

    if (selectedCategory) {

      // Load subcategories of selected category
      this.retailerService
        .getSubCategories(selectedCategory.categoryId)
        .subscribe({
          next: (data) => {

            this.subcategories = data;

            // Set saved subcategory after loading dropdown
            this.productForm.patchValue({
              SubCategoryName: res.subCategoryName
            });

          },
          error: (err) => {
            console.log(err);
          }
        });
    }
  });
}

  //  HANDLE MULTIPLE IMAGE SELECT
  onImageSelect(event: any) {
    const files: FileList = event.target.files;
    this.handleFiles(files)

    // Keep existing selected images if any
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newFiles.push(file);

        //  image preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          newPreviews.push(e.target.result);
          // Only update after all previews are loaded
          if (newPreviews.length === newFiles.length) {
            this.selectedImages = [...this.selectedImages, ...newFiles];
            this.previewUrls = [...this.previewUrls, ...newPreviews];
            this.chng.detectChanges();
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }

  //  REMOVE SELECTED IMAGE
  removeSelectedImage(index: number) {
    this.selectedImages.splice(index, 1);
    this.previewUrls.splice(index, 1);
    this.chng.detectChanges();
  }

  //  SUBMIT FORM
  submit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.productForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    const formData = new FormData();
    formData.append('productName', this.productForm.value.productName);
    formData.append('productDescription', this.productForm.value.productDescription);
    formData.append('CategoryName', this.productForm.value.CategoryName);
    formData.append('SubCategoryName', this.productForm.value.SubCategoryName);
    formData.append('productPrice', this.productForm.value.productPrice);
    formData.append('stock', this.productForm.value.stock);

    console.log('Form Data:', {
      productName: this.productForm.value.productName,
      productDescription: this.productForm.value.productDescription,
      CategoryName: this.productForm.value.CategoryName,
      SubCategoryName: this.productForm.value.SubCategoryName,
      productPrice: this.productForm.value.productPrice,
      stock: this.productForm.value.stock
    });

    //  MULTIPLE IMAGES APPEND
    if (this.selectedImages.length > 0) {
      for (let file of this.selectedImages) {
        formData.append('imagepath', file); // must match backend
      }
    }

    //  EDIT / ADD LOGIC
    if (this.isEdit) {
      this.retailerService.updateProduct(this.productId!, formData).subscribe({
        next: () => {
          this.successMessage = 'Product updated successfully ';
          setTimeout(() => {
            this.router.navigate(['retailerNavbar/products']);
          }, 1500);
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to update product. Please try again.';
        }
      });
    } else {
      this.retailerService.addProduct(formData).subscribe({
        next: () => {
          this.successMessage = 'Product added successfully ';
          console.log('Product added successfully', this.productForm.value);
          setTimeout(() => {
            this.router.navigate(['retailerNavbar/products']);
          }, 1500);
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to add product. Please try again.';
        }
      });
    }
  }

  //  CANCEL
  cancel() {
    this.router.navigate(['retailerNavbar/products']);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  handleFiles(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.previewUrls.push(URL.createObjectURL(file));
      this.selectedImages.push(file);
    }
  }
}