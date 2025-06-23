import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {Alert} from "react-native";

export default function useCurrentLocation() {
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use the map."
        );
        return;
      };
      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation([
        userLocation.coords.longitude,
        userLocation.coords.latitude,
      ]);
    })();
  }, []);

  return location;
}
