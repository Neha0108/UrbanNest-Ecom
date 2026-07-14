import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Category } from "../../../LandingPage/category/category";
import { SuggestedProducts } from "../suggested-products/suggested-products";
import { ShopByPrice } from "../../../LandingPage/shop-by-price/shop-by-price";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({
  ignoreMobileResize: true
});

@Component({
  selector: 'app-welcome',
  imports: [RouterLink, Category, SuggestedProducts, ShopByPrice],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome implements AfterViewInit, OnDestroy {

  constructor(private router: Router) {}

  goToCategory(categoryName: string) {
    this.router.navigate(
      ['/consumerNavbar/userdashboard'],
      { queryParams: { category: categoryName } }
    );
  }

  ngAfterViewInit(): void {
    this.setupHorizontalScroll();
  }

  setupHorizontalScroll() {

    const section = document.querySelector('#portfolio') as HTMLElement;
    if (!section) return;

    const strip = section.querySelector('.horiz-gallery-strip') as HTMLElement;
    if (!strip) return;

    const cards = gsap.utils.toArray('.project-wrap');

    const scrollWidth = strip.scrollWidth;
    const totalScroll = scrollWidth - window.innerWidth + 100;

    /*  SNAP FIX (NO ERROR) */
    const snapSettings = cards.length > 1 ? {
      snapTo: 1 / (cards.length - 1),
      duration: 0.4,
      ease: "power2.out"
    } : false;

    gsap.to(strip, {
      x: -totalScroll,
      ease: "none",

      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=" + scrollWidth,

        pin: true,
        scrub: 1,

        snap: snapSettings as any,  //  FINAL FIX HERE

        invalidateOnRefresh: true
      }
    });
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  scrollToCategories() {
    const categoriesSection = document.getElementById('categories');
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
