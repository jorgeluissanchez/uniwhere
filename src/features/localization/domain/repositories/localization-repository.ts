import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';

export type LocalizationImageParam = {
  uri: string;
  name: string;
  type: string;
};

export interface LocalizationRepository {
  localize(serie: string, image: LocalizationImageParam): Promise<LocalizationResult>;
}
