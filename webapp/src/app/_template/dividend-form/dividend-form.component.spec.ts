import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DividendFormComponent } from './dividend-form.component';

describe('DividendFormComponent', () => {
  let component: DividendFormComponent;
  let fixture: ComponentFixture<DividendFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DividendFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DividendFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
