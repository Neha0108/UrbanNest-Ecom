import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../LandingPage/category/category';
import { ShopByPrice } from '../../LandingPage/shop-by-price/shop-by-price';
import { Footer } from '../../LandingPage/footer/footer';
import { Consumer } from '../../service/consumer';
import { Product } from '../../interface/product';
import { Offers } from "../../components/consumer/offers/offers";
import { SuggestedProducts } from "../../components/consumer/suggested-products/suggested-products";
import { UserService } from '../../service/user-service';

interface HeroSlide {
  title: string;
  subtitle: string;
  buttonText: string;
  image: string;
  category: string;
}

interface WhyFeature {
  icon: string;
  title: string;
  desc: string;
}

interface StatItem {
  target: number;
  suffix: string;
  label: string;
  display: string;
  staticValue?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule, Category, ShopByPrice, Footer, Offers, SuggestedProducts],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {

  private router = inject(Router);
  private chng = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private consumerService = inject(Consumer);
  private userService = inject(UserService);

  @ViewChild('statsSection') statsSection?: ElementRef<HTMLElement>;
  @ViewChild('heroSection') heroSection?: ElementRef<HTMLElement>;

  currentSlide = 0;
  private sliderInterval: any;
  private statsObserver?: IntersectionObserver;
  private statsAnimated = false;

  trendingProducts: Product[] = [];
  subscribed = false;

  slides: HeroSlide[] = [
    {
      title: 'Elevate Everyday Living',
      subtitle: 'Curated furniture, decor and lifestyle pieces for the modern home.',
      buttonText: 'Shop The Collection',
      image: 'assets/addvertisement/home-banner.png',
      category: 'Home',
    },
    {
      title: 'Mega Fashion Days',
      subtitle: 'Up to 60% off on premium fashion, footwear and accessories.',
      buttonText: 'Shop Fashion',
      image: 'assets/addvertisement/fashion-banner.png',
      category: 'Fashion',
    },
    {
      title: 'Beauty Essentials Week',
      subtitle: 'Skincare, wellness and beauty — starting at ₹99.',
      buttonText: 'Shop Beauty',
      image: 'assets/addvertisement/beauty-banner.png',
      category: 'Beauty',
    },
  ];

  features: WhyFeature[] = [
    {
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.4 6.6L21 10l-5 4.4L17.4 21 12 17.3 6.6 21 8 14.4 3 10l6.6-1.4L12 2z"/></svg>`,
      title: 'Curated Quality',
      desc: 'Every piece is handpicked and quality-checked before it reaches you.',
    },
    {
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12l2-2 4 4 10-10 2 2L9 18z"/></svg>`,
      title: 'Trusted Retailers',
      desc: 'A verified network of retailers committed to craftsmanship.',
    },
    {
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 10h13l4 4v6h-4M3 10v10h4M3 10l3-6h9l3 6M8 20a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z"/></svg>`,
      title: 'Reliable Delivery',
      desc: 'Fast, careful delivery designed for busy urban lives.',
    },
    {
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/></svg>`,
      title: 'Loved By Thousands',
      desc: 'Built around comfort, trust and long-term satisfaction.',
    },
  ];

  stats: StatItem[] = [
    { target: 10000, suffix: '+', label: 'Products', display: '0' },
    { target: 500, suffix: '+', label: 'Retailers', display: '0' },
    { target: 50000, suffix: '+', label: 'Happy Customers', display: '0' },
    { target: 0, suffix: '', label: 'Support', display: '24/7', staticValue: '24/7' },
  ];

  newsletterForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // ================= NEW: product-card micro-interaction state (UI only) =================
  // Client-side presentation state for the redesigned trending cards.
  // Wire these to your real wishlist/cart endpoints on Consumer when ready.
  private wishlist = new Set<number>();
  addingToCartId: number | null = null;
  addedToCartId: number | null = null;
  quickViewProduct: Product | null = null;

  ngOnInit(): void {
    this.loadTrending();

    this.sliderInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      this.chng.detectChanges();
    }, 5000);
  }

  ngAfterViewInit(): void {
    if (this.statsSection) {
      this.statsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.statsAnimated) {
              this.statsAnimated = true;
              this.animateStats();
            }
          });
        },
        { threshold: 0.3 }
      );
      this.statsObserver.observe(this.statsSection.nativeElement);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.sliderInterval);
    this.statsObserver?.disconnect();
  }

  loadTrending(): void {

  this.consumerService.allProducts().subscribe({

    next: (data: Product[]) => {

      console.log(data);
      this.trendingProducts=data.slice(0,8);

      console.log(this.trendingProducts);

      this.chng.detectChanges();

    },

    error:(err)=>{

      console.error(err);

    }

  });

}

  setSlide(i: number): void {
    this.currentSlide = i;
  }

  goToProducts(category?: string): void {
    if (category) {
      this.router.navigate(['/products'], { queryParams: { category: encodeURIComponent(category) } });
    } else {
      this.router.navigate(['/products']);
    }
  }

  goToProduct(product: Product): void {
    this.router.navigate(['/product-details/' + product.productId]);
  }

  scrollToCategories(): void {
    document.querySelector('app-category')?.scrollIntoView({ behavior: 'smooth' });
  }

  subscribeNewsletter(): void {
    if (this.newsletterForm.invalid) return;
    // TODO: wire up to your Newsletter API endpoint when ready
    this.subscribed = true;
    this.newsletterForm.reset();
    setTimeout(() => (this.subscribed = false), 4000);
  }

  private animateStats(): void {
    const duration = 1600;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      this.stats = this.stats.map((s) =>
        s.staticValue
          ? s
          : { ...s, display: Math.floor(eased * s.target).toLocaleString() + s.suffix }
      );

      this.chng.detectChanges();

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  // ================= NEW: hero parallax (mouse-follow gold glow) =================
  onHeroMouseMove(e: MouseEvent): void {
    const el = this.heroSection?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', `${x}%`);
    el.style.setProperty('--my', `${y}%`);
  }

  // ================= NEW: trending product card interactions (UI only) =================
  private idOf(product: Product): number {
    return (product as any).productId;
  }

  isWishlisted(product: Product): boolean {
    return this.wishlist.has(this.idOf(product));
  }

  toggleWishlist(product: Product, event: Event): void {
    event.stopPropagation();
    const id = this.idOf(product);
    if (this.wishlist.has(id)) this.wishlist.delete(id);
    else this.wishlist.add(id);
  }

  quickAddToCart(product: Product, event: Event): void {
    event.stopPropagation();
    const id = this.idOf(product);
    if (this.addingToCartId === id) return;
    this.addingToCartId = id;
    // TODO: call Consumer.addToCart(id) here once available; presentation-only for now.
    setTimeout(() => {
      this.addingToCartId = null;
      this.addedToCartId = id;
      this.chng.detectChanges();
      setTimeout(() => {
        this.addedToCartId = null;
        this.chng.detectChanges();
      }, 1400);
    }, 550);
  }

  openQuickView(product: Product, event: Event): void {
    event.stopPropagation();
    this.quickViewProduct = product;
  }

  closeQuickView(): void {
    this.quickViewProduct = null;
  }

  discountBadge(product: Product): number | null {
    return (product as any).discountPercent ?? (product as any).discount ?? null;
  }

  stockLabel(product: Product): string | null {
    const stock = (product as any).stock ?? (product as any).stockQuantity;
    if (stock === undefined || stock === null) return null;
    if (stock <= 0) return 'Out of stock';
    if (stock <= 5) return `Only ${stock} left`;
    return null;
  }

  retailerName(product: Product): string | null {
    return (product as any).retailerShopName ?? (product as any).retailerName ?? null;
  }

  ratingOf(product: Product): number {
    return (product as any).rating ?? 4.5;
  }

  trackByProductId = (index: number, item: Product): number => {
    return item.productId;
  }

  isLoggedIn(): boolean {
  return this.userService.isLoggedIn();
}

}