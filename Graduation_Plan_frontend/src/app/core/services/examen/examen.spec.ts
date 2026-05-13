import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ExamenService } from './examen';

describe('ExamenService', () => {
  let service: ExamenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(ExamenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
