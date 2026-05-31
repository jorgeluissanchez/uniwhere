import { LocalizationRemoteDataSource } from '@/features/localization/data/datasources/localization-remote-data-source';
import { LocalizationRepository, LocalizationImageParam } from '@/features/localization/domain/repositories/localization-repository';
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';

export class LocalizationRepositoryImpl implements LocalizationRepository {
  constructor(private readonly remoteDS: LocalizationRemoteDataSource) {}

  localize(serie: string, image: LocalizationImageParam): Promise<LocalizationResult> {
    return this.remoteDS.localize(serie, image);
  }
}
