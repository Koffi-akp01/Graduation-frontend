import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DirecteurSuiviComponent } from './directeur-suivi';

describe('DirecteurSuiviComponent', () => {
  let component: DirecteurSuiviComponent;
  let fixture: ComponentFixture<DirecteurSuiviComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirecteurSuiviComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirecteurSuiviComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
