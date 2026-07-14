import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestedProducts } from './suggested-products';

describe('SuggestedProducts', () => {
  let component: SuggestedProducts;
  let fixture: ComponentFixture<SuggestedProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestedProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestedProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
