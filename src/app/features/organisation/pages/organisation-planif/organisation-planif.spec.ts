import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganisationPlanifComponent } from './organisation-planif';

describe('OrganisationPlanifComponent', () => {
  let component: OrganisationPlanifComponent;
  let fixture: ComponentFixture<OrganisationPlanifComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganisationPlanifComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganisationPlanifComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
