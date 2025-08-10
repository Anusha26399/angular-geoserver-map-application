import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatastoreComponent } from './datastore';

describe('Datastore', () => {
  let component: DatastoreComponent;
  let fixture: ComponentFixture<DatastoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatastoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatastoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
