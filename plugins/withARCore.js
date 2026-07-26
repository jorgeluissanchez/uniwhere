/**
 * Declara ARCore como `optional` en el AndroidManifest del app.
 *
 * `optional` significa que la app se instala y funciona en dispositivos sin
 * ARCore; sólo pierde la experiencia AR. Es lo que usa la mayoría de las apps
 * que tienen AR como feature secundaria. Para requerir ARCore (impedir
 * instalación sin soporte), cambiar a `required`.
 *
 * El propio @reactvision/react-viro ya inyecta parte de la integración
 * nativa en iOS/Android. Esto es un complemento para Android porque sin el
 * meta-data ARCore no aparece como dependencia opcional en el manifest.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const AR_CORE_META = {
  $: {
    'android:name': 'com.google.ar.core',
    'android:value': 'optional',
  },
};

module.exports = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;

    application['meta-data'] = application['meta-data'] || [];

    // No duplicar si otra pasada del plugin ya lo insertó.
    const alreadyDeclared = application['meta-data'].some(
      (entry) => entry?.$?.['android:name'] === 'com.google.ar.core',
    );
    if (!alreadyDeclared) {
      application['meta-data'].push(AR_CORE_META);
    }

    return config;
  });
};
