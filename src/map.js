import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { terrainSVG } from './illustrations.js';
import { category } from './data.js';
import { escape, icon } from './icons.js';
let map;
export function destroyMap() { if (map) { map.remove(); map = null; } }
export function mountMap(properties, selected, portfolio, onSelect) {
  destroyMap();
  const el = document.getElementById('property-map'); if (!el) return;
  const p = properties.find(p => p.id === selected);
  map = L.map(el, { zoomControl: false, attributionControl: true, minZoom: 10, maxZoom: 19, scrollWheelZoom: false }).setView([p.lat+.0002,p.lng], 17);
  const activeMap = map;
  // Initialize the view before adding grouped vector layers so renderer bounds exist.
  map.createPane('schematic');
  map.getPane('schematic').style.zIndex = '150';
  L.imageOverlay(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(terrainSVG())}`, [[38.395,-122.78],[38.535,-122.59]], { interactive: false, pane: 'schematic', zIndex: 0 }).addTo(map);
  map.attributionControl.setPrefix(false);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors' });
  let failed = false;
  const setMapLabel = text => {
    if (map === activeMap) document.getElementById('map-mode').textContent = text;
  };
  tiles.on('load', () => {
    if (!failed && activeMap.hasLayer(tiles)) setMapLabel('OpenStreetMap · synthetic overlays');
  });
  tiles.on('tileerror', () => {
    if (failed || map !== activeMap) return;
    failed = true;
    // Remove the entire failed basemap so real geography is not mixed with synthetic roads.
    queueMicrotask(() => {
      if (map !== activeMap) return;
      activeMap.removeLayer(tiles);
      document.getElementById('street-map').checked = false;
      setMapLabel('Local schematic · map tiles unavailable');
    });
  });
  const groups = { boundary: L.layerGroup().addTo(map), vegetation: L.layerGroup().addTo(map), exposure: L.layerGroup().addTo(map), mitigation: L.layerGroup().addTo(map) };
  const d = portfolio ? .001 : .00075;
  properties.forEach(prop => {
    const lat = prop.lat, lng = prop.lng;
    L.polygon([[lat-d,lng-d*1.4],[lat+d*.9,lng-d*1.15],[lat+d*1.15,lng+d],[lat-d*.7,lng+d*1.35]], { color: '#6a8470', weight: 2, dashArray: '5 5', fillColor: '#f1e8c9', fillOpacity: .35 }).addTo(groups.boundary);
    L.polygon([[lat+d*.25,lng+d*.55],[lat+d*1.7,lng+d*.35],[lat+d*2,lng+d*2],[lat-d*.3,lng+d*2.2]], { color: '#789368', weight: 1, fillColor: '#829e6d', fillOpacity: .45 }).addTo(groups.vegetation);
    L.circle([lat+d*2,lng+d*2.5], { radius: 145, color: '#b38277', weight: 1, dashArray: '3 7', fillColor: '#c58d7d', fillOpacity: .12 }).addTo(groups.exposure);
    L.rectangle([[lat-d*.42,lng-d*.6],[lat+d*.38,lng+d*.55]], { color: prop.verification === 'Verified in demo' ? '#527b60' : '#bc9951', weight: 2, fillColor: '#dbc78a', fillOpacity: .35 }).addTo(groups.mitigation);
    L.polygon([[lat-.00013,lng-.00024],[lat+.00017,lng-.00018],[lat+.00012,lng+.00022],[lat-.00018,lng+.00016]], { color: '#777b72', weight: 1.5, fillColor: '#b8b6aa', fillOpacity: 1 }).addTo(map);
    const marker = L.marker([lat,lng], { title: prop.name, alt: `Select ${prop.name}, ${category(prop.score)}, ${prop.score}`, icon: L.divIcon({ className: `property-marker ${prop.id === selected ? 'selected' : ''}`, html: `<span>${icon('home')}</span>`, iconSize: [38,44], iconAnchor: [19,42] }), keyboard: true });
    marker.addTo(map).on('click', () => onSelect(prop.id));
    if (prop.id === selected || portfolio) marker.bindTooltip(`<strong>${escape(prop.name)}</strong><span>${prop.score} / 100 · ${category(prop.score)}</span>`, { permanent: !portfolio, direction: 'top', offset: [0,-43], className: 'property-tooltip' });
  });
  const fit = () => portfolio ? map.fitBounds(properties.map(p => [p.lat,p.lng]), { padding: [60,65] }) : map.setView([p.lat+.0002,p.lng], 17);
  // Keep an offline schematic beneath the real street tiles as a presentation fallback.
  if (!portfolio) {
    L.imageOverlay(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(terrainSVG())}`, [[p.lat-.0045,p.lng-.006],[p.lat+.0045,p.lng+.006]], { pane: 'schematic', zIndex: 1 }).addTo(map);
  }
  fit();
  tiles.addTo(map);
  document.querySelectorAll('[data-layer]').forEach(input => input.addEventListener('change', () => input.checked ? groups[input.dataset.layer].addTo(map) : map.removeLayer(groups[input.dataset.layer])));
  document.getElementById('map-fit')?.addEventListener('click', fit);
  document.getElementById('zoom-in')?.addEventListener('click', () => map.zoomIn());
  document.getElementById('zoom-out')?.addEventListener('click', () => map.zoomOut());
  document.getElementById('street-map')?.addEventListener('change', e => {
    if (e.target.checked) {
      failed = false;
      setMapLabel('Street basemap · loading');
      tiles.addTo(map);
    } else {
      map.removeLayer(tiles);
      setMapLabel('Illustrative local schematic');
    }
  });
  map.on('click', () => el.focus({ preventScroll: true }));
}
