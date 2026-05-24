import { LocalizationImageParam } from '@/features/localization/domain/repositories/localization-repository';
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';

export interface LocalizationRemoteDataSource {
  localize(serie: string, image: LocalizationImageParam): Promise<LocalizationResult>;
}
