import { createConfig } from './config/createConfig'
import createClient from './createClient/server'

import { globalI18n } from './appWithTranslation'

import { Namespace } from 'i18next'
import { SSRConfig, UserConfig } from './types'
import { getFallbackForLng, unique } from './utils'

let DEFAULT_CONFIG_PATH = '/next-i18next.config.js'

/**
 * One line expression like `const { I18NEXT_DEFAULT_CONFIG_PATH: DEFAULT_CONFIG_PATH = './next-i18next.config.js' } = process.env;`
 * is breaking the build, so keep it like this.
 *
 * @see https://github.com/i18next/next-i18next/pull/2084#issuecomment-1420511358
 */
if (process.env.I18NEXT_DEFAULT_CONFIG_PATH) {
  DEFAULT_CONFIG_PATH = process.env.I18NEXT_DEFAULT_CONFIG_PATH
}

type ArrayElementOrSelf<T> = T extends Array<infer U> ? U[] : T[]

export const serverSideTranslations = async (
  initialLocale: string,
  namespacesRequired:
    | ArrayElementOrSelf<Namespace>
    | undefined = undefined,
  configOverride: UserConfig | null = null,
  extraLocales: string[] | false = false
): Promise<SSRConfig> => {
  if (typeof initialLocale !== 'string') {
    throw new Error(
      'Initial locale argument was not passed into serverSideTranslations'
    )
  }

  let userConfig = configOverride

  if (!userConfig) {
    userConfig = await import(DEFAULT_CONFIG_PATH)
  }

  if (userConfig === null) {
    throw new Error(
      `next-i18next was unable to find a user config at ${DEFAULT_CONFIG_PATH}`
    )
  }

  const config = createConfig({
    ...userConfig,
    lng: initialLocale,
  })

  const { localePath, fallbackLng, reloadOnPrerender, namespaces } =
    config

  if (reloadOnPrerender) {
    await globalI18n?.reloadResources()
  }

  const { i18n, initPromise } = createClient({
    ...config,
    lng: initialLocale,
  })

  await initPromise

  const initialI18nStore: Record<string, any> = {
    [initialLocale]: {},
  }

  getFallbackForLng(initialLocale, fallbackLng ?? false)
    .concat(extraLocales || [])
    .forEach((lng: string) => {
      initialI18nStore[lng] = {}
    })

  if (!Array.isArray(namespacesRequired)) {
    if (typeof localePath === 'function') {
      throw new Error(
        'Must provide namespacesRequired to serverSideTranslations when using a function as localePath'
      )
    }
    namespacesRequired = unique(namespaces ?? [])
  }

  console.log(i18n.services.resourceStore.data)

  namespacesRequired.forEach(ns => {
    for (const locale in initialI18nStore) {
      initialI18nStore[locale][ns] =
        (i18n.services.resourceStore.data[locale] || {})[ns] || {}
    }
  })

  return {
    _nextI18Next: {
      initialI18nStore,
      initialLocale,
      ns: namespacesRequired,
      userConfig: config.serializeConfig ? userConfig : null,
    },
  }
}
