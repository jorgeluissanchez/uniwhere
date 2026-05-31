import React from 'react';
import { render } from '@testing-library/react-native';
import { JobProgress } from '@/features/reconstruction/presentation/components/job-progress';
import { ReconstructionJob } from '@/features/reconstruction/domain/entities/reconstruction-job';

const makeJob = (overrides: Partial<ReconstructionJob> = {}): ReconstructionJob => ({
  jobId: 'job-abcdef12',
  status: 'pending',
  progress: [],
  error: null,
  ...overrides,
});

describe('JobProgress', () => {
  it('shows pending label', () => {
    const { getByText } = render(<JobProgress job={makeJob()} />);
    expect(getByText('En espera')).toBeTruthy();
  });

  it('shows done label', () => {
    const { getByText } = render(<JobProgress job={makeJob({ status: 'done' })} />);
    expect(getByText('Completado')).toBeTruthy();
  });

  it('shows error label and error message', () => {
    const { getByText } = render(
      <JobProgress job={makeJob({ status: 'error', error: 'Falló la reconstrucción' })} />
    );
    expect(getByText('Error')).toBeTruthy();
    expect(getByText('Falló la reconstrucción')).toBeTruthy();
  });

  it('shows progress lines', () => {
    const { getByText } = render(
      <JobProgress job={makeJob({ status: 'reconstructing', progress: ['step 1', 'step 2'] })} />
    );
    expect(getByText('› step 1')).toBeTruthy();
    expect(getByText('› step 2')).toBeTruthy();
  });

  it('shows jobId short prefix', () => {
    const { getByText } = render(<JobProgress job={makeJob({ jobId: 'abcdef1234567890' })} />);
    expect(getByText('#abcdef12')).toBeTruthy();
  });

  it('matches snapshot for pending job', () => {
    const { toJSON } = render(<JobProgress job={makeJob()} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('matches snapshot for done job', () => {
    const { toJSON } = render(<JobProgress job={makeJob({ status: 'done' })} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
