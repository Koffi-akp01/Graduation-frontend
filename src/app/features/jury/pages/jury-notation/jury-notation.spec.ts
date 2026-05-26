import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JuryNotationComponent } from './jury-notation';

describe('JuryNotationComponent', () => {
  let component: JuryNotationComponent;
  let fixture: ComponentFixture<JuryNotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuryNotationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JuryNotationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
