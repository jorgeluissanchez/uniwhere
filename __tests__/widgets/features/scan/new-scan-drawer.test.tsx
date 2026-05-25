import React from 'react';
import { render } from '@testing-library/react-native';
import { NewScanDrawer } from '@/features/scan/presentation/components/new-scan-drawer';

// All heavy native deps (drawer, reanimated, lucide) are mocked via moduleNameMapper in jest.config.js

jest.mock('@/features/reconstruction/presentation/context/reconstruction-context');
jest.mock('@/features/scan/presentation/context/scan-context');
jest.mock('@/features/auth/presentation/context/auth-context');

import { useReconstruction } from '@/features/reconstruction/presentation/context/reconstruction-context';
import { useScan } from '@/features/scan/presentation/context/scan-context';
import { useAuth } from '@/features/auth/presentation/context/auth-context';

const mockUseReconstruction = useReconstruction as jest.MockedFunction<typeof useReconstruction>;
const mockUseScan = useScan as jest.MockedFunction<typeof useScan>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function setupMocks(overrides: { submitting?: boolean; error?: string | null } = {}) {
  const { submitting = false, error = null } = overrides;
  mockUseReconstruction.mockReturnValue({
    submitting,
    error,
    startJob: jest.fn().mockResolvedValue({ jobId: 'job-1', serie: 'serie-1' }),
  } as any);
  mockUseScan.mockReturnValue({
    scans: [],
    portadas: {},
    loading: false,
    error: null,
    saveScan: jest.fn().mockResolvedValue(undefined),
    deleteScan: jest.fn(),
    updateScan: jest.fn(),
    refresh: jest.fn(),
  } as any);
  mockUseAuth.mockReturnValue({
    loggedUser: { userId: 'u1', name: 'Alice', email: 'alice@example.com', role: 'student' },
    isLoggedIn: true,
    loading: false,
    error: null,
    clearError: jest.fn(),
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    expireSession: jest.fn(),
    forgotPassword: jest.fn(),
    getLoggedUser: jest.fn(),
  } as any);
}

describe('NewScanDrawer', () => {
  beforeEach(() => setupMocks());

  it('renders title when open', () => {
    const { getByText } = render(<NewScanDrawer open onClose={jest.fn()} />);
    expect(getByText('NUEVO ESCANEO')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    const { queryByText } = render(<NewScanDrawer open={false} onClose={jest.fn()} />);
    expect(queryByText('NUEVO ESCANEO')).toBeNull();
  });

  it('shows error from reconstruction context', () => {
    setupMocks({ error: 'Serie inválida' });
    const { getByText } = render(<NewScanDrawer open onClose={jest.fn()} />);
    expect(getByText('Serie inválida')).toBeTruthy();
  });

  it('matches snapshot when open', () => {
    const { toJSON } = render(<NewScanDrawer open onClose={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
