import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { OrganisationPlanifComponent } from './organisation-planif';

describe('OrganisationPlanifComponent', () => {
  let component: OrganisationPlanifComponent;
  let fixture: ComponentFixture<OrganisationPlanifComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganisationPlanifComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganisationPlanifComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
