import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamenCheckComponent } from './examen-check';

describe('ExamenCheckComponent', () => {
  let component: ExamenCheckComponent;
  let fixture: ComponentFixture<ExamenCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamenCheckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamenCheckComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
