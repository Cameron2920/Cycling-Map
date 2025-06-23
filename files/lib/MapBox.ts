import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { MAPBOX_ACCESS_TOKEN } from '@env';

export const geocodingClient = mbxGeocoding({ accessToken: MAPBOX_ACCESS_TOKEN });
export const directionsClient = mbxDirections({ accessToken: MAPBOX_ACCESS_TOKEN });
