# 🗺️ Dummy Map Component

A fully functional map component that mimics Google Maps behavior without requiring an API key. Perfect for development, testing, and demonstration purposes.

## ✨ Features

- **📍 Interactive Map** - Click to select locations
- **🔍 Search Functionality** - Search for places with dummy data
- **🎯 Custom Markers** - Add and manage location markers
- **🔍 Zoom Controls** - Zoom in/out with buttons
- **🗺️ Map Types** - Switch between Road and Satellite views
- **📍 Current Location** - Get real GPS coordinates
- **📱 Responsive Design** - Works on all devices
- **🎨 Professional Styling** - Clean, modern interface
- **⚡ No API Key Required** - Ready to use immediately

## 🚀 Quick Start

### 1. Import the Component

```jsx
import DummyMap from './components/DummyMap';
import './components/DummyMap.css';
```

### 2. Basic Usage

```jsx
<DummyMap
  center={{ lat: 28.6139, lng: 77.2090 }}
  zoom={10}
  onLocationSelect={(location) => console.log(location)}
/>
```

### 3. Advanced Usage

```jsx
<DummyMap
  center={{ lat: 28.6139, lng: 77.2090 }}
  zoom={12}
  markers={[
    { lat: 28.6448, lng: 77.2167, title: 'New Delhi Railway Station' },
    { lat: 28.6129, lng: 77.2295, title: 'India Gate' }
  ]}
  onLocationSelect={(location) => setSelectedLocation(location)}
  height="500px"
  width="100%"
  showSearch={true}
  showControls={true}
/>
```

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `center` | `{lat: number, lng: number}` | `{lat: 28.6139, lng: 77.2090}` | Initial map center |
| `zoom` | `number` | `10` | Initial zoom level (1-20) |
| `markers` | `Array` | `[]` | Array of marker objects |
| `onLocationSelect` | `function` | `undefined` | Callback when location is selected |
| `height` | `string` | `'400px'` | Map height |
| `width` | `string` | `'100%'` | Map width |
| `showSearch` | `boolean` | `true` | Show search bar |
| `showControls` | `boolean` | `true` | Show zoom and map type controls |

## 🎯 Marker Object

```jsx
{
  lat: 28.6448,           // Latitude
  lng: 77.2167,           // Longitude
  title: 'Marker Title'   // Optional title
}
```

## 🔍 Search Locations

The dummy map includes these searchable locations:
- New Delhi Railway Station
- India Gate
- Red Fort
- Connaught Place
- Lotus Temple
- Qutub Minar
- Akshardham Temple
- Jama Masjid

## 🎨 Styling

The component comes with professional CSS styling that includes:
- Modern Google Maps-like interface
- Responsive design for mobile and desktop
- Dark mode support
- Smooth animations and transitions
- Custom marker styles

## 📱 Responsive Design

The map automatically adapts to different screen sizes:
- **Desktop**: Full controls and search bar
- **Tablet**: Optimized layout
- **Mobile**: Compact controls and touch-friendly interface

## 🔧 Customization

### Custom Styling

```css
.dummy-map-container {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.dummy-map {
  border-radius: 8px;
}
```

### Custom Markers

```jsx
const customMarkers = [
  {
    lat: 28.6448,
    lng: 77.2167,
    title: 'Emergency Station',
    icon: '🚨' // Custom emoji
  }
];
```

## 🚀 Integration with EMS

### For Emergency Services

```jsx
// Emergency location selection
<DummyMap
  center={{ lat: 28.6139, lng: 77.2090 }}
  markers={emergencyStations}
  onLocationSelect={(location) => {
    setEmergencyLocation(location);
    // Send to backend
    reportEmergency(location);
  }}
  height="400px"
  showSearch={true}
/>
```

### For Resource Management

```jsx
// Resource location tracking
<DummyMap
  markers={resourceLocations}
  onLocationSelect={(location) => {
    updateResourceLocation(resourceId, location);
  }}
  showControls={true}
/>
```

## 🎯 Event Handling

### Location Selection

```jsx
const handleLocationSelect = (location) => {
  console.log('Selected:', location);
  // location = { lat: 28.6139, lng: 77.2090 }
  
  // Update state
  setSelectedLocation(location);
  
  // Send to backend
  saveLocation(location);
};
```

### Marker Management

```jsx
const [markers, setMarkers] = useState([]);

const addMarker = (location) => {
  const newMarker = {
    ...location,
    title: `Marker ${markers.length + 1}`
  };
  setMarkers([...markers, newMarker]);
};

const removeMarker = (index) => {
  setMarkers(markers.filter((_, i) => i !== index));
};
```

## 🔄 State Management

### With React State

```jsx
const [mapState, setMapState] = useState({
  center: { lat: 28.6139, lng: 77.2090 },
  zoom: 10,
  markers: []
});

const updateMapState = (updates) => {
  setMapState(prev => ({ ...prev, ...updates }));
};
```

### With Redux

```jsx
const mapStateToProps = (state) => ({
  center: state.map.center,
  markers: state.map.markers
});

const mapDispatchToProps = (dispatch) => ({
  selectLocation: (location) => dispatch(selectLocation(location)),
  addMarker: (marker) => dispatch(addMarker(marker))
});
```

## 🧪 Testing

### Unit Tests

```jsx
import { render, fireEvent } from '@testing-library/react';
import DummyMap from './DummyMap';

test('selects location on click', () => {
  const onLocationSelect = jest.fn();
  const { container } = render(
    <DummyMap onLocationSelect={onLocationSelect} />
  );
  
  fireEvent.click(container.querySelector('.dummy-map'));
  expect(onLocationSelect).toHaveBeenCalled();
});
```

### Integration Tests

```jsx
test('adds marker when location is selected', () => {
  const { getByText } = render(<MapExample />);
  
  // Click map to select location
  fireEvent.click(getByText('Add Marker'));
  
  // Check if marker was added
  expect(getByText('Marker 1')).toBeInTheDocument();
});
```

## 🚀 Performance

- **Lightweight**: No external API calls
- **Fast Rendering**: Optimized CSS animations
- **Memory Efficient**: Minimal DOM manipulation
- **Smooth Interactions**: 60fps animations

## 🔒 Security

- **No API Keys**: No external dependencies
- **Local Data**: All data stays in your application
- **Privacy**: No location data sent to external services
- **Secure**: No third-party tracking

## 🎯 Use Cases

### Development
- **Prototyping**: Quick map integration
- **Testing**: No API key required
- **Demo**: Show map functionality

### Production
- **Emergency Services**: Location selection
- **Resource Management**: Asset tracking
- **User Interface**: Location-based features

## 📞 Support

For issues or questions:
1. Check the component props
2. Verify CSS is imported
3. Test with the example component
4. Check browser console for errors

## 🔄 Migration to Real Google Maps

When ready to use real Google Maps:

1. **Get API Key**: Follow the Google Maps API setup
2. **Replace Component**: Swap DummyMap with Google Maps component
3. **Update Props**: Adjust props to match Google Maps API
4. **Test Integration**: Verify all functionality works

The dummy map provides the same interface, making migration seamless!

---

**🎉 Your dummy map is ready to use! No API key required!** 🗺️

