import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsumerNavbar } from './consumer-navbar';

describe('ConsumerNavbar', () => {
  let component: ConsumerNavbar;
  let fixture: ComponentFixture<ConsumerNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsumerNavbar],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsumerNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
