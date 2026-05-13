import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirecteurSuiviComponent } from './directeur-suivi';

describe('DirecteurSuiviComponent', () => {
  let component: DirecteurSuiviComponent;
  let fixture: ComponentFixture<DirecteurSuiviComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirecteurSuiviComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirecteurSuiviComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
