import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectionThemesComponent } from './direction-themes';

describe('DirectionThemesComponent', () => {
  let component: DirectionThemesComponent;
  let fixture: ComponentFixture<DirectionThemesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectionThemesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectionThemesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
