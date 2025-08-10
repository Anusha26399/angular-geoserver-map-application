import { TestBed } from '@angular/core/testing';

import { GeoServerService } from './geoserver.service';

describe('GeoserverService', () => {
  let service: GeoServerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoServerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
