import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecouvrementListeComponent } from './recouvrement-liste';

describe('RecouvrementListeComponent', () => {
  let component: RecouvrementListeComponent;
  let fixture: ComponentFixture<RecouvrementListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecouvrementListeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecouvrementListeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
