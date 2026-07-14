import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Retailer } from '../../../service/retailer';
import { Review } from '../../../interface/review';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reviews',
  imports: [CommonModule, FormsModule],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class Reviews implements OnInit {

  private retailerService = inject(Retailer);
  private chng = inject(ChangeDetectorRef);

  reviews: Review[] = [];
  loading = true;
  errorMessage = '';

  avgRating = 0;
  totalReviews = 0;

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews() {
    this.loading = true;
    this.retailerService.getMyReviews().subscribe({
      next: (data: Review[]) => {
        this.reviews = data;
        this.totalReviews = data.length;
        this.avgRating = data.length
          ? Math.round((data.reduce((sum, r) => sum + r.rating, 0) / data.length) * 10) / 10
          : 0;
        this.loading = false;
        this.chng.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Failed to load reviews.';
        this.loading = false;
        this.chng.detectChanges();
      }
    });
  }

  starsArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= rating);
  }

  replyText: { [reviewId: number]: string } = {};
  replyingTo: number | null = null;

startReply(reviewId: number): void {
  this.replyingTo = reviewId;
}

submitReply(reviewId: number): void {
  const message = this.replyText[reviewId]?.trim();
  if (!message) return;

  this.retailerService.replyToReview(reviewId, message).subscribe({
    next: () => {
      this.replyingTo = null;
      this.loadReviews();
    },
    error: (err) => console.error('Failed to reply', err)
  });
}
}