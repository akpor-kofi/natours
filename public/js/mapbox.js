/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYWtwb3Jrb2ZpMTEiLCJhIjoiY2wyaWh5dGlzMG55MzNlbDViZGN3c2E5ZyJ9.dTDdcdTBJdGr5rWzVfXkrw';

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/akporkofi11/cl2ip5c8j000i14n4982gi6u2",
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker'

    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    //Add popup
    new mapboxgl.Popup({
      // to make it not overlap
      offset: 30
    }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map)

    // extend map bounds to include current location
    bounds.extend(loc.coordinates);
  })

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100
    }
  })
}

