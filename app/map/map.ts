import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { defaults as defaultControls, Attribution, Zoom } from 'ol/control';

interface ActiveLayer {
  id: string;
  name: string;
  workspace: string;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrls: ['./map.css']
})
export class MapComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() activeLayers: ActiveLayer[] = [];
  @Input() geoServerBaseUrl: string = 'http://192.168.20.69:8080/geoserver';
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map!: OlMap;
  private mapLayers = new Map<string, TileLayer<TileWMS>>();
  private isMapInitialized = false;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.waitForContainerAndInitialize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeLayers'] && this.isMapInitialized) {
      this.updateMapLayers();
    }
  }

  private waitForContainerAndInitialize(): void {
    requestAnimationFrame(() => {
      const container = this.mapContainer.nativeElement;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        setTimeout(() => this.waitForContainerAndInitialize(), 50);
        return;
      }
      this.initializeMap();
    });
  }

  private initializeMap(): void {
    if (this.isMapInitialized) return;

    const zoomControl = new Zoom({ className: 'ol-zoom' });

    this.map = new OlMap({
      target: this.mapContainer.nativeElement,
      controls: defaultControls({ attribution: false, zoom: false }).extend([
        zoomControl
      ]),
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([78.96, 20.59]),
        zoom: 5
      })
    });

    this.isMapInitialized = true;
    this.map.updateSize();

    if (this.activeLayers.length > 0) {
      this.updateMapLayers();
    }
  }

  private updateMapLayers(): void {
    const currentLayerIds = new Set(this.mapLayers.keys());
    const expectedLayerIds = new Set(this.activeLayers.map(l => l.id));

    // Remove inactive layers
    currentLayerIds.forEach(layerId => {
      if (!expectedLayerIds.has(layerId)) {
        const layer = this.mapLayers.get(layerId);
        if (layer) {
          this.map.removeLayer(layer);
          this.mapLayers.delete(layerId);
        }
      }
    });

    // Add new active layers
    this.activeLayers.forEach(layer => {
      if (!this.mapLayers.has(layer.id)) {
        const wmsSource = new TileWMS({
          url: `${this.geoServerBaseUrl}/wms`,
          params: {
            'LAYERS': `${layer.workspace}:${layer.name}`,
            'TILED': true,
            'FORMAT': 'image/png',
            'TRANSPARENT': true,
            'VERSION': '1.1.0'
          },
          serverType: 'geoserver',
          transition: 0
        });

        const tileLayer = new TileLayer({ source: wmsSource });
        this.map.addLayer(tileLayer);
        this.mapLayers.set(layer.id, tileLayer);
      }
    });
  }

  refreshMapSize(): void {
    if (this.map && this.isMapInitialized) {
      this.map.updateSize();
    }
  }

  fitToLayerExtent(workspace: string, layerName: string): void {
    if (layerName === 'bbsr') {
      this.setCenter(85.8282, 20.2811, 13);
    }
  }

  setCenter(lon: number, lat: number, zoom?: number): void {
    if (this.map && this.isMapInitialized) {
      const view = this.map.getView();
      view.setCenter(fromLonLat([lon, lat]));
      if (zoom) view.setZoom(zoom);
    }
  }

  getMap(): OlMap {
    return this.map;
  }

  getCenter(): [number, number] | null {
    if (this.map && this.isMapInitialized) {
      const center = this.map.getView().getCenter();
      return center as [number, number];
    }
    return null;
  }
}
