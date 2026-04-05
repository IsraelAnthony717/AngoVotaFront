import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EleitorComponent } from './eleitor.component';

describe('EleitorComponent', () => {
  let component: EleitorComponent;
  let fixture: ComponentFixture<EleitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EleitorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EleitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
