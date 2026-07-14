import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ordersucccess } from './ordersucccess';

describe('Ordersucccess', () => {
  let component: Ordersucccess;
  let fixture: ComponentFixture<Ordersucccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ordersucccess],
    }).compileComponents();

    fixture = TestBed.createComponent(Ordersucccess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
