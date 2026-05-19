import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { PaiementService } from './paiement';

describe('PaiementService', () => {
  let service: PaiementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(PaiementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
