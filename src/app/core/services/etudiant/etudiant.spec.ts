import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { EtudiantService } from './etudiant';

describe('EtudiantService', () => {
  let service: EtudiantService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(EtudiantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
