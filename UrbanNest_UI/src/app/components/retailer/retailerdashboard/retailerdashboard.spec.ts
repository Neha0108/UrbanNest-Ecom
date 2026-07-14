import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Retailerdashboard } from './retailerdashboard';

describe('Retailerdashboard', () => {
  let component: Retailerdashboard;
  let fixture: ComponentFixture<Retailerdashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Retailerdashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(Retailerdashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
