import { http, HttpResponse } from 'msw';

const RECON = process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL ?? 'http://localhost:8000';

export const reconstructionHandlers = [
  http.post(`${RECON}/reconstruct`, () =>
    HttpResponse.json({ job_id: 'job-abc', serie: 'serie-x' }),
  ),

  http.get(`${RECON}/status/:jobId`, ({ params }) =>
    HttpResponse.json({
      job_id: params.jobId,
      serie: 'serie-x',
      status: 'done',
      progress: ['step1', 'step2'],
      error: null,
    }),
  ),
];
