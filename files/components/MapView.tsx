// components/MapView.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import {Route} from "@/files/hooks/useDirections";
import {LatLng, Place} from "@/files/lib/MapBox";

type Props = {
  currentCoordinate: LatLng;
  endPlace: Place | null;
  startPlace: Place | null;
  waypoints: Place[];
  routeCoordinates: Array<LatLng>;
  routes: Array<Route>;
  selectedRoute: Route;
  onMapPress: (event: any) => void;
  mockLocation: boolean;
  isNavigating: boolean;
};

export default function MapViewComponent({
                                           currentCoordinate,
                                           startPlace,
                                           endPlace,
                                           waypoints,
                                           selectedRoute,
                                           routes,
                                           onMapPress,
                                           mockLocation,
                                           isNavigating,
                                         }: Props) {
  const cameraCenter = endPlace?.center ?? currentCoordinate;

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

      {endPlace && (
        <MapboxGL.PointAnnotation
          id="selectedPlace"
          coordinate={endPlace.center}
        >
          <View style={styles.markerContainer}>
            <View style={styles.marker} />
          </View>
          <MapboxGL.Callout title={endPlace.name} />
        </MapboxGL.PointAnnotation>
      )}

      {startPlace && (
        <MapboxGL.PointAnnotation
          id="selectedPlace"
          coordinate={startPlace.center}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.marker, {backgroundColor: "green"}]} />
          </View>
          <MapboxGL.Callout title={startPlace.name} />
        </MapboxGL.PointAnnotation>
      )}

      {waypoints.map((waypoint, index) => (
        <MapboxGL.PointAnnotation
          id={'waypoint' + index.toString()}
          key={index.toString()}
          coordinate={waypoint.center}
        >
          <View style={styles.markerContainer}>
            <View style={styles.waypointMarker} />
          </View>
          <MapboxGL.Callout title={waypoint.name} />
        </MapboxGL.PointAnnotation>
      ))}

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
  waypointMarker: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "green",
    borderColor: "white",
    borderWidth: 2,
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
