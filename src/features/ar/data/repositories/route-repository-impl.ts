import { SavedRoute } from '../../domain/entities/route';
import { RouteRepository } from '../../domain/repositories/route-repository';
import { RouteStorageDataSource } from '../datasources/route-storage-data-source';

export class RouteRepositoryImpl implements RouteRepository {
  constructor(private readonly ds: RouteStorageDataSource) {}

  saveRoute(route: SavedRoute): Promise<void> { return this.ds.saveRoute(route); }
  loadRoute(): Promise<SavedRoute | null>      { return this.ds.loadRoute(); }
  clearRoute(): Promise<void>                  { return this.ds.clearRoute(); }
}
