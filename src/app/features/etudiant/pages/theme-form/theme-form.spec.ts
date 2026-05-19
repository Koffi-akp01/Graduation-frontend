import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeFormComponent } from './theme-form';

describe('ThemeFormComponent', () => {
  let component: ThemeFormComponent;
  let fixture: ComponentFixture<ThemeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemeFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
