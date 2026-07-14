import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailerNavbar } from './navbar';

describe('RetailerNavbar', () => {
  let component: RetailerNavbar;
  let fixture: ComponentFixture<RetailerNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetailerNavbar],
    }).compileComponents();

    fixture = TestBed.createComponent(RetailerNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
