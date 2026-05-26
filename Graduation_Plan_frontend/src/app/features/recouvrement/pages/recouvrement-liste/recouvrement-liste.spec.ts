import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RecouvrementListeComponent } from './recouvrement-liste';

describe('RecouvrementListeComponent', () => {
  let component: RecouvrementListeComponent;
  let fixture: ComponentFixture<RecouvrementListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecouvrementListeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecouvrementListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
