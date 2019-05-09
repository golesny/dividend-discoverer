import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockHeaderComponent } from './stock-header.component';

describe('StockHeaderComponent', () => {
  let component: StockHeaderComponent;
  let fixture: ComponentFixture<StockHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
