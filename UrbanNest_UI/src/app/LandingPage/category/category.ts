import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  QueryList,
  ViewChildren
} from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import Flip from 'gsap/Flip';
import { Category as cat } from '../../interface/category';
import { CommonModule } from '@angular/common';
import { Consumer } from '../../service/consumer';

gsap.registerPlugin(Flip);

@Component({
  selector: 'app-category',
  imports: [CommonModule],
  templateUrl: './category.html',
  styleUrls: ['./category.css']
})
export class Category implements AfterViewInit {

  @ViewChildren('categoryCard')
  cards!: QueryList<ElementRef>;

  categories: cat[] = [];

  private categoryService = inject(Consumer);
  private chng = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('Categories fetched successfully:', categories);
        this.chng.detectChanges();
      }
    });
  }

  activeIndex = 0;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.animateCards();
    });
  }

  setActive(index: number): void {

  this.activeIndex = index;

  const activeCard =
    this.cards.toArray()[index].nativeElement;

  activeCard.scrollIntoView({
    behavior: 'smooth',
    inline: 'center',
    block: 'nearest'
  });

}

animateCards(): void {

  const cards = this.cards.map(card => card.nativeElement);

  if (!cards.length) return;

  gsap.from(cards, {
    opacity: 0,
    y: 100,
    duration: 1,
    stagger: 0.15,
    ease: 'power3.out'
  });

}
  goToProducts(category: cat): void {

    this.router.navigate(['consumerNavbar/userdashboard'], {
      queryParams: {
        category: encodeURIComponent(category.categoryName)
      }
    });

  }
}