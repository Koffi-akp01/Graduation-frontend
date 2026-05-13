import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { PlanificationService } from './planification';

describe('PlanificationService', () => {
  let service: PlanificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(PlanificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
