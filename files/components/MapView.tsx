// components/MapView.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import MapboxGL from "@rnmapbox/maps";

type Props = {
  currentCoordinate: [number, number];
  selectedPlace: { center: [number, number]; name?: string } | null;
  routeCoordinates: Array<[number, number]>;
  onMapPress: (event: any) => void;
  mockLocation: boolean;
};

export default function MapViewComponent({
                                           currentCoordinate,
                                           selectedPlace,
                                           routeCoordinates,
                                           onMapPress,
                                           mockLocation,
                                         }: Props) {
  const cameraCenter = selectedPlace?.center ?? currentCoordinate;

  return (
    <MapboxGL.MapView style={StyleSheet.absoluteFill} onPress={onMapPress}>
      <MapboxGL.Camera zoomLevel={13} centerCoordinate={cameraCenter} />
      <MapboxGL.UserLocation visible={!mockLocation} />
      {mockLocation && (
        <MapboxGL.PointAnnotation
          id="mock-user"
          coordinate={currentCoordinate}
        >
          <View style={styles.markerContainer}>
            <View style={styles.userMarker} />
          </View>
        </MapboxGL.PointAnnotation>
      )}

      {selectedPlace && (
        <MapboxGL.PointAnnotation
          id="selectedPlace"
          coordinate={selectedPlace.center}
        >
          <View style={styles.markerContainer}>
            <View style={styles.marker} />
          </View>
          <MapboxGL.Callout title={selectedPlace.name} />
        </MapboxGL.PointAnnotation>
      )}

      {routeCoordinates.length > 0 && (
        <MapboxGL.ShapeSource
          id="routeSource"
          shape={{
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: routeCoordinates,
            },
          }}
        >
          <MapboxGL.LineLayer
            id="routeLine"
            style={{
              lineColor: "#007AFF",
              lineWidth: 4,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </MapboxGL.ShapeSource>
      )}
    </MapboxGL.MapView>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
  },
  marker: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "red",
    borderColor: "white",
    borderWidth: 2,
  },
  userMarker: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "blue",
    borderColor: "white",
    borderWidth: 2,
  },
});
