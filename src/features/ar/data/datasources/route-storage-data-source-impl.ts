import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';
import { SavedRoute } from '../../domain/entities/route';
import { RouteStorageDataSource } from './route-storage-data-source';

const ROUTE_KEY = 'ar_route';

export class RouteStorageDataSourceImpl implements RouteStorageDataSource {
  private readonly prefs = LocalPreferencesAsyncStorage.getInstance();

  async saveRoute(route: SavedRoute): Promise<void> {
    await this.prefs.storeData(ROUTE_KEY, route);
  }

  async loadRoute(): Promise<SavedRoute | null> {
    return this.prefs.retrieveData<SavedRoute>(ROUTE_KEY);
  }

  async clearRoute(): Promise<void> {
    await this.prefs.removeData(ROUTE_KEY);
  }
}
