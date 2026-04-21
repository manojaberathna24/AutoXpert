import React from 'react';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

type Coordinate = {
    latitude: number;
    longitude: number;
};

interface MapPickerProps {
    location: Coordinate | null;
    onLocationSelect: (coordinate: Coordinate) => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ location, onLocationSelect }) => {
    const handleMapPress = (e: MapPressEvent) => {
        onLocationSelect(e.nativeEvent.coordinate);
    };

    return (
        <MapView
            style={styles.map}
            initialRegion={{
                latitude: location?.latitude || 7.8731,
                longitude: location?.longitude || 80.7718,
                latitudeDelta: 2.5,
                longitudeDelta: 2.5,
            }}
            onPress={handleMapPress}
        >
            {location && <Marker coordinate={location} />}
        </MapView>
    );
};

const styles = StyleSheet.create({
    map: { width: '100%', height: 300, borderRadius: 10 },
});

export default MapPicker;
