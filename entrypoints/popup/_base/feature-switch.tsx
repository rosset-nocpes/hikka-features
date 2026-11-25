import type { ReactNode } from 'react';

import SwitchOption from './switch-option';

export type Features = ReturnType<typeof useSettings.getState>['features'];

type BooleanKey<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

interface Props<F extends keyof Features> {
  feature: F;
  /** The setting it toggles; `enabled` by default. */
  option?: BooleanKey<Features[F]>;
  /** The switch is on while the setting is off, e.g. for `hidden`. */
  inverted?: boolean;
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  beta?: boolean;
  disabled?: boolean;
}

/** A switch for one of a feature's settings. */
function FeatureSwitch<F extends keyof Features>({
  feature,
  option,
  inverted = false,
  ...props
}: Props<F>) {
  const key = (option ?? 'enabled') as BooleanKey<Features[F]>;
  const value = useSettings((state) => state.features[feature][key] as boolean);

  return (
    <SwitchOption
      {...props}
      checked={value !== inverted}
      onClick={() =>
        useSettings
          .getState()
          .updateFeatureSettings(feature, { [key]: !value } as Partial<
            Features[F]
          >)
      }
    />
  );
}

export default FeatureSwitch;
