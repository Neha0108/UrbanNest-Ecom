import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopByPrice } from './shop-by-price';

describe('ShopByPrice', () => {
  let component: ShopByPrice;
  let fixture: ComponentFixture<ShopByPrice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopByPrice],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopByPrice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
