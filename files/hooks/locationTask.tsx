import * as TaskManager from 'expo-task-manager';
import { LatLng } from '../lib/MapBox';

export const LOCATION_TASK_NAME = 'background-location-task';

let _onBackgroundLocationUpdate: ((location: LatLng) => Promise<void> | void) | null = null;

export function setOnBackgroundLocationUpdate(
  fn: ((location: LatLng) => Promise<void> | void) | null
) {
  _onBackgroundLocationUpdate = fn;
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  console.log("Task manager", data);
  if (error) {
    console.error("TaskManager location error:", error);
    return;
  }

  if (!data) return;

  try {
    const { locations } = data as any;
    const latest = locations[0];

    if (latest && _onBackgroundLocationUpdate) {
      const coords: LatLng = [
        latest.coords.longitude,
        latest.coords.latitude,
      ];
      await _onBackgroundLocationUpdate(coords);
    }
  } catch (err) {
    console.error("Background task error:", err);
  }
});
