import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { SoutenanceService } from './soutenance';

describe('SoutenanceService', () => {
  let service: SoutenanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(SoutenanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
