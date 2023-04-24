import i18n from 'i18next'
import i18nextHttpBackend from 'i18next-http-backend'

import {
  CreateClientReturn,
  I18n,
  InitPromise,
  InternalConfig,
} from '../types'

let globalInstance: I18n

export default (config: InternalConfig): CreateClientReturn => {
  if (config.ns === undefined) config.ns = []
  let instance: I18n
  if (!globalInstance) {
    globalInstance = i18n.createInstance(config)
    instance = globalInstance
  } else {
    instance = globalInstance.cloneInstance({
      ...config,
      initImmediate: false,
    })
  }
  let initPromise: InitPromise

  if (!instance.isInitialized) {
    // TODO: Add default backend? we might not need one
    instance.use(
      // i18nextResourcesBackend(
      //   async (language: string, namespace: string) => {
      //     console.log('CALLED!', language, namespace)
      //     const data = await import(
      //       `${config.localePath}/${language}/${namespace}.json`
      //     )

      //     return data
      //   }
      // )
      i18nextHttpBackend
    )

    config?.use?.forEach(x => instance.use(x))
    if (typeof config.onPreInitI18next === 'function') {
      config.onPreInitI18next(instance)
    }
    initPromise = instance.init(config)
  } else {
    initPromise = Promise.resolve(i18n.t)
  }

  return { i18n: instance, initPromise }
}
