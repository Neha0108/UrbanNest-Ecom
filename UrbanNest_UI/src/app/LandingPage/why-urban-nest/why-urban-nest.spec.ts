import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhyUrbanNest } from './why-urban-nest';

describe('WhyUrbanNest', () => {
  let component: WhyUrbanNest;
  let fixture: ComponentFixture<WhyUrbanNest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhyUrbanNest],
    }).compileComponents();

    fixture = TestBed.createComponent(WhyUrbanNest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
