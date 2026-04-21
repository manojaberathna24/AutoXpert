import React from 'react';
import { StyleSheet, View, Text, TextInput } from 'react-native';

type Coordinate = {
    latitude: number;
    longitude: number;
};

interface MapPickerProps {
    location: Coordinate | null;
    onLocationSelect: (coordinate: Coordinate) => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ location, onLocationSelect }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Map selection is not supported on web.</Text>
            <Text style={styles.subtext}>Enter your store coordinates below:</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Latitude:</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="7.8731"
                    value={location?.latitude?.toString() || ''}
                    onChangeText={(val) => onLocationSelect({
                        latitude: parseFloat(val) || 0,
                        longitude: location?.longitude || 80.7718
                    })}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Longitude:</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="80.7718"
                    value={location?.longitude?.toString() || ''}
                    onChangeText={(val) => onLocationSelect({
                        latitude: location?.latitude || 7.8731,
                        longitude: parseFloat(val) || 0
                    })}
                />
            </View>

            {location && (
                <Text style={styles.coordText}>
                    Location Set: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    text: { fontSize: 16, fontWeight: 'bold', color: '#555', textAlign: 'center' },
    subtext: { fontSize: 14, color: '#888', marginTop: 5, marginBottom: 15, textAlign: 'center' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: { width: 80, fontWeight: 'bold' },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 8,
        backgroundColor: '#fff'
    },
    coordText: { fontSize: 14, color: '#28a745', marginTop: 10, textAlign: 'center', fontWeight: 'bold' }
});

export default MapPicker;
