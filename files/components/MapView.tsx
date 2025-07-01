// components/MapView.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import {Route} from "@/files/hooks/useDirections";
import {LatLng} from "@/files/lib/MapBox";

type Props = {
  currentCoordinate: LatLng;
  selectedPlace: { center: LatLng; name?: string } | null;
  routeCoordinates: Array<LatLng>;
  routes: Array<Route>;
  selectedRoute: Route;
  onMapPress: (event: any) => void;
  mockLocation: boolean;
};

export default function MapViewComponent({
                                           currentCoordinate,
                                           selectedPlace,
                                           selectedRoute,
                                           routes,
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

      {routes.map((route, index) => (
        <MapboxGL.ShapeSource
          key={`route-${index}`}
          id={`routeSource-${index}`}
          shape={{
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: route.coordinates,
            },
          }}
        >
          <MapboxGL.LineLayer
            id={`routeLine-${index}`}
            style={{
              lineColor: route === selectedRoute ? "#007AFF" : "#A0A0A0", // main vs alternatives
              lineWidth: route === selectedRoute ? 5 : 3,
              lineOpacity: route === selectedRoute ? 1 : 0.6,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </MapboxGL.ShapeSource>
      ))}
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
