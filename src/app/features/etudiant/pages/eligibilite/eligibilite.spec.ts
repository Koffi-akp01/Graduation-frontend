import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EligibiliteComponent } from './eligibilite';

describe('EligibiliteComponent', () => {
  let component: EligibiliteComponent;
  let fixture: ComponentFixture<EligibiliteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EligibiliteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EligibiliteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
