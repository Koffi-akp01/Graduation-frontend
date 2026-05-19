import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ExamenCheckComponent } from './examen-check';

describe('ExamenCheckComponent', () => {
  let component: ExamenCheckComponent;
  let fixture: ComponentFixture<ExamenCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamenCheckComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExamenCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
