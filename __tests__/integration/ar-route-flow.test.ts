import { RouteRepositoryImpl } from '@/features/ar/data/repositories/route-repository-impl';
import { RouteStorageDataSourceImpl } from '@/features/ar/data/datasources/route-storage-data-source-impl';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';

// AR route flow is pure local storage — no HTTP involved.
// This integration test exercises the real repository + data source against mocked AsyncStorage.

describe('AR Route integration — repository with mocked AsyncStorage', () => {
  let repo: RouteRepositoryImpl;

  beforeEach(async () => {
    repo = new RouteRepositoryImpl(new RouteStorageDataSourceImpl());
    // Clear persisted route between tests
    await LocalPreferencesAsyncStorage.getInstance().removeData('ar_route');
  });

  it('saveRoute persists points and loadRoute returns them', async () => {
    const points = [{ row: 0, col: 0 }, { row: 1, col: 2 }];
    await repo.saveRoute(points);
    const loaded = await repo.loadRoute();
    expect(loaded).toEqual(points);
  });

  it('loadRoute returns null when nothing is saved', async () => {
    const loaded = await repo.loadRoute();
    expect(loaded).toBeNull();
  });

  it('clearRoute removes persisted route', async () => {
    await repo.saveRoute([{ row: 0, col: 0 }]);
    await repo.clearRoute();
    const loaded = await repo.loadRoute();
    expect(loaded).toBeNull();
  });

  it('saveRoute overwrites previous route', async () => {
    await repo.saveRoute([{ row: 0, col: 0 }]);
    const newPoints = [{ row: 5, col: 5 }, { row: 6, col: 6 }];
    await repo.saveRoute(newPoints);
    const loaded = await repo.loadRoute();
    expect(loaded).toEqual(newPoints);
  });
});
