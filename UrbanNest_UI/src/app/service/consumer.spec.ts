import { TestBed } from '@angular/core/testing';

import { Consumer } from './consumer';

describe('Consumer', () => {
  let service: Consumer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Consumer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
