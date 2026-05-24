import { SavedRoute } from '../../domain/entities/route';

export interface RouteStorageDataSource {
  saveRoute(route: SavedRoute): Promise<void>;
  loadRoute(): Promise<SavedRoute | null>;
  clearRoute(): Promise<void>;
}
