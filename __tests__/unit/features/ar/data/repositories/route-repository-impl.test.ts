// __tests__/unit/features/ar/data/repositories/route-repository-impl.test.ts
import { RouteRepositoryImpl } from '@/features/ar/data/repositories/route-repository-impl';

const mockDS = {
  saveRoute: jest.fn(),
  loadRoute: jest.fn(),
  clearRoute: jest.fn(),
};

describe('RouteRepositoryImpl', () => {
  let repo: RouteRepositoryImpl;

  beforeEach(() => {
    repo = new RouteRepositoryImpl(mockDS as any);
    jest.clearAllMocks();
  });

  it('saveRoute delegates to datasource', async () => {
    const route = [{ row: 0, col: 0 }];
    await repo.saveRoute(route);
    expect(mockDS.saveRoute).toHaveBeenCalledWith(route);
  });

  it('loadRoute returns null when datasource returns null', async () => {
    mockDS.loadRoute.mockResolvedValue(null);
    const result = await repo.loadRoute();
    expect(result).toBeNull();
  });

  it('clearRoute delegates to datasource', async () => {
    await repo.clearRoute();
    expect(mockDS.clearRoute).toHaveBeenCalled();
  });
});
