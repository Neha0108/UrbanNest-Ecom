import { TestBed } from '@angular/core/testing';

import { Retailer } from './retailer';

describe('Retailer', () => {
  let service: Retailer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Retailer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
