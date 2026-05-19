import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { JuryNotationComponent } from './jury-notation';

describe('JuryNotationComponent', () => {
  let component: JuryNotationComponent;
  let fixture: ComponentFixture<JuryNotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuryNotationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JuryNotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
