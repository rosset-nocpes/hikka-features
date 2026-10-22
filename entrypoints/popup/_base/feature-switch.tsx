import SwitchOption from './switch-option';

type Features = ReturnType<typeof useSettings.getState>['features'];

type BooleanKey<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

interface Props<F extends keyof Features> {
  feature: F;
  /** The setting it toggles; `enabled` by default. */
  option?: BooleanKey<Features[F]>;
  label: string;
  description?: string;
  beta?: boolean;
}

/** A switch for one of a feature's settings. */
function FeatureSwitch<F extends keyof Features>({
  feature,
  option,
  ...props
}: Props<F>) {
  const key = (option ?? 'enabled') as BooleanKey<Features[F]>;
  const checked = useSettings(
    (state) => state.features[feature][key] as boolean,
  );

  return (
    <SwitchOption
      {...props}
      checked={checked}
      onClick={() =>
        useSettings
          .getState()
          .updateFeatureSettings(feature, { [key]: !checked } as Partial<
            Features[F]
          >)
      }
    />
  );
}

export default FeatureSwitch;
