import { SavedRoute } from '../entities/route';

export interface RouteRepository {
  saveRoute(route: SavedRoute): Promise<void>;
  loadRoute(): Promise<SavedRoute | null>;
  clearRoute(): Promise<void>;
}
