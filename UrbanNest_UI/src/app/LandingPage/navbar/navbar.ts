import { Component, ChangeDetectorRef, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { Consumer } from '../../service/consumer';
import { Product } from '../../interface/product';
import { Category } from '../../interface/category';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { Footer } from "../footer/footer";
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterOutlet, Footer, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnDestroy {

  @ViewChild('collectionPanel', { static: false }) collectionPanel!: ElementRef<HTMLElement>;

  products: Product[] = [];
  visibleProducts: Product[] = [];
  categories: Category[] = [];
  activePanel: 'home' | 'collection' | 'category' = 'home';
  isCollectionOpen = false;
  showMore = false;
  isLoadingCollection = false;
  currentSlide = 0;
  private hideTimeout?: number;
  private sliderWheelHandler?: (e: WheelEvent) => void;
  private isSliderInitialized = false;

  setHome() {
    this.activePanel = 'home';
    this.isCollectionOpen = false;
    this.showMore = false;
  }
  resetToHome() {
    if (!this.isCollectionOpen) {
      this.activePanel = 'home';
    }
  }

  constructor(private consumer: Consumer, private cdr: ChangeDetectorRef, private router: Router) { }

  ngOnDestroy(): void {
    if (this.sliderWheelHandler) {
      window.removeEventListener('wheel', this.sliderWheelHandler);
    }
  }

  showTabPreview(tab: 'collection' | 'category') {
    const panel = this.collectionPanel?.nativeElement;
    if (!panel) return;
    this.cancelHidePreview();

    this.activePanel = tab;
    this.isCollectionOpen = true;
    this.showMore = tab === 'collection';
    panel.classList.add('active');
    this.currentSlide = 0;
    gsap.set(panel, { visibility: 'visible', opacity: 1 });

    if (tab === 'category') {
      this.loadCategoryPreview();
    } else {
      this.loadCollectionProducts(true);
    }
  }

  scheduleHidePreview() {
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = window.setTimeout(() => {
      this.hideCollectionPreview();
      this.resetToHome(); //  THIS LINE IMPORTANT
    }, 150);
  }

  cancelHidePreview() {
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
  }

  hideCollectionPreview() {
    const panel = this.collectionPanel?.nativeElement;
    if (!panel) return;

    this.isCollectionOpen = false;
    this.showMore = false;
    this.cancelHidePreview();

    gsap.to(panel, {
      height: 0,
      opacity: 0,
      duration: 0.25,
      ease: 'power3.in',
      onComplete: () => {
        panel.classList.remove('active');
        gsap.set(panel, { height: 0, visibility: 'hidden' });
      }
    });
  }

  loadCategoryPreview() {
    console.log('🔷 loadCategoryPreview called, cached categories:', this.categories.length);

    const renderCategories = () => {
      this.isLoadingCollection = false;
      this.cdr.markForCheck();
      requestAnimationFrame(() => {
        this.expandPanel();
      });
    };

    if (this.categories.length) {
      renderCategories();
      return;
    }

    this.isLoadingCollection = true;
    this.consumer.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories || [];
        renderCategories();
      },
      error: (err) => {
        console.error('❌ Category API Error:', err);
        this.categories = [];
        this.isLoadingCollection = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadCollectionProducts(showAll = false) {
    console.log('🔷 loadCollectionProducts called, cached products:', this.products.length);

    const renderProducts = () => {
      this.visibleProducts = showAll ? this.products.slice() : this.products.slice(0, 4);
      console.log('📦 Visible products:', this.visibleProducts.length);
      this.isLoadingCollection = false;
      this.cdr.markForCheck();
      requestAnimationFrame(() => {
        this.animateProductCards(0.12);
        this.expandPanel();
      });
    };

    if (this.products.length) {
      renderProducts();
      return;
    }

    this.isLoadingCollection = true;
    console.log('🔄 Fetching products from API...');
    this.consumer.allProducts().subscribe({
      next: (products) => {
        console.log(' API Response:', products);
        this.products = products || [];
        renderProducts();
      },
      error: (err) => {
        console.error('❌ API Error:', err);
        this.products = [];
        this.visibleProducts = [];
        this.isLoadingCollection = false;
        this.cdr.markForCheck();
      }
    });
  }

  showMoreProducts() {
    this.showMore = true;
    this.visibleProducts = this.products.slice();
    this.cdr.markForCheck();
    requestAnimationFrame(() => {
      this.animateProductCards(0);
      this.expandPanel();
    });
  }

  viewAllProducts() {
  this.isCollectionOpen = false;  
  this.activePanel = 'home';       // optional (reset tab)

  this.router.navigate(['/products']); //  route to product page
}

  slidePrev() {
    if (this.currentSlide <= 0) return;
    this.currentSlide -= 3;
    if (this.currentSlide < 0) this.currentSlide = 0;

    this.slideTo(this.currentSlide);
  }

  slideNext() {
    const maxSlide = this.visibleProducts.length - 3;

    if (this.currentSlide >= maxSlide) return;

    this.currentSlide += 3;

    if (this.currentSlide > maxSlide) {
      this.currentSlide = maxSlide;
    }

    this.slideTo(this.currentSlide);
  }

  private slideTo(index: number) {
    const panel = this.collectionPanel.nativeElement;
    const track = panel.querySelector('.slider-track') as HTMLElement;

    if (!track) return;

    //  Move full track instead of each card
    gsap.to(track, {
      x: `-${index * (100 / 3)}%`,
      duration: 0.7,
      ease: 'power4.out'
    });
  }

  private expandPanel() {
    const panel = this.collectionPanel?.nativeElement;
    if (!panel) return;
    const actualHeight = panel.scrollHeight;
    console.log('📏 Panel scrollHeight:', actualHeight);
    gsap.to(panel, {
      height: actualHeight,
      duration: 0.5,
      ease: 'power3.out',
      onComplete: () => {
        gsap.set(panel, { height: 'auto' });
      }
    });
  }

  private animateProductCards(delay: number) {
    const cards = Array.from(this.collectionPanel.nativeElement.querySelectorAll('.product-card'));
    if (cards.length) {
      gsap.from(cards, {
        autoAlpha: 0,
        y: 30,
        duration: 0.5,
        stagger: 0.06,
        delay,
        ease: 'power3.out'
      });
    }
  }
}