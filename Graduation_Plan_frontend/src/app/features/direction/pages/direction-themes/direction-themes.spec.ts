import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DirectionThemesComponent } from './direction-themes';

describe('DirectionThemesComponent', () => {
  let component: DirectionThemesComponent;
  let fixture: ComponentFixture<DirectionThemesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectionThemesComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectionThemesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
