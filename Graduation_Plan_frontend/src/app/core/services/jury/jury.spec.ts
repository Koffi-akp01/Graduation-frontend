import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { JuryService } from './jury';

describe('JuryService', () => {
  let service: JuryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(JuryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
