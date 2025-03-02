import { FallbackLngObjList } from 'i18next'
import { InternalConfig, UserConfig } from '../types'
import { unique } from '../utils'
import { defaultConfig } from './defaultConfig'

const deepMergeObjects = ['backend', 'detection'] as (keyof Pick<
  UserConfig,
  'backend' | 'detection'
>)[]

export const createConfig = (
  userConfig: UserConfig
): InternalConfig => {
  if (typeof userConfig?.lng !== 'string') {
    throw new Error('config.lng was not passed into createConfig')
  }

  //
  // Initial merge of default and user-provided config
  //
  const { i18n: userI18n, ...userConfigStripped } = userConfig
  const { i18n: defaultI18n, ...defaultConfigStripped } =
    defaultConfig
  const combinedConfig = {
    ...defaultConfigStripped,
    ...userConfigStripped,
    ...defaultI18n,
    ...userI18n,
  }

  const {
    defaultNS,
    lng,
    localeExtension,
    localePath,
    nonExplicitSupportedLngs,
    namespaces,
  } = combinedConfig

  const locales = combinedConfig.locales.filter(l => l !== 'default')

  /**
   * Skips translation file resolution while in cimode
   * https://github.com/i18next/next-i18next/pull/851#discussion_r503113620
   */
  if (lng === 'cimode') {
    return combinedConfig as InternalConfig
  }

  if (typeof combinedConfig.fallbackLng === 'undefined') {
    combinedConfig.fallbackLng = combinedConfig.defaultLocale
    if (combinedConfig.fallbackLng === 'default')
      [combinedConfig.fallbackLng] = locales
  }

  const userPrefix = userConfig?.interpolation?.prefix
  const userSuffix = userConfig?.interpolation?.suffix
  const prefix = userPrefix ?? '{{'
  const suffix = userSuffix ?? '}}'
  if (
    typeof userConfig?.localeStructure !== 'string' &&
    (userPrefix || userSuffix)
  ) {
    combinedConfig.localeStructure = `${prefix}lng${suffix}/${prefix}ns${suffix}`
  }

  const { fallbackLng, localeStructure } = combinedConfig

  if (nonExplicitSupportedLngs) {
    const createFallbackObject = (
      acc: FallbackLngObjList,
      l: string
    ) => {
      const [locale] = l.split('-')
      acc[l] = [locale]
      return acc
    }

    if (typeof fallbackLng === 'string') {
      combinedConfig.fallbackLng = combinedConfig.locales
        .filter(l => l.includes('-'))
        .reduce(createFallbackObject, { default: [fallbackLng] })
    } else if (Array.isArray(fallbackLng)) {
      combinedConfig.fallbackLng = combinedConfig.locales
        .filter(l => l.includes('-'))
        .reduce(createFallbackObject, { default: fallbackLng })
    } else if (typeof fallbackLng === 'object') {
      combinedConfig.fallbackLng = Object.entries(
        combinedConfig.fallbackLng
      ).reduce<FallbackLngObjList>((acc, [l, f]) => {
        acc[l] = l.includes('-')
          ? unique([l.split('-')[0], ...f])
          : f
        return acc
      }, fallbackLng as FallbackLngObjList)
    } else if (typeof fallbackLng === 'function') {
      throw new Error(
        'If nonExplicitSupportedLngs is true, no functions are allowed for fallbackLng'
      )
    }
  }

  const hasCustomBackend = userConfig?.use?.some(
    b => b.type === 'backend'
  )
  if (!process.browser && typeof window === 'undefined') {
    combinedConfig.preload = locales

    if (!hasCustomBackend) {
      //
      // Validate defaultNS
      // https://github.com/i18next/next-i18next/issues/358
      //

      //
      // Set server side backend
      //
      if (typeof localePath === 'string') {
        combinedConfig.backend = {
          addPath: `${localePath}/${localeStructure}.missing.${localeExtension}`,
          loadPath: `${localePath}/${localeStructure}.${localeExtension}`,
        }
      } else if (typeof localePath === 'function') {
        combinedConfig.backend = {
          addPath: (locale: string, namespace: string) =>
            localePath(locale, namespace, true),
          loadPath: (locale: string, namespace: string) =>
            localePath(locale, namespace, false),
        }
      } else {
        throw new Error(
          `Unsupported localePath type: ${typeof localePath}`
        )
      }

      //
      // Set server side preload (namespaces)
      //
      if (!combinedConfig.ns && typeof lng !== 'undefined') {
        if (typeof localePath === 'function') {
          throw new Error(
            'Must provide all namespaces in ns option if using a function as localePath'
          )
        }

        const getNamespaces = (): string[] =>
          unique([`${defaultNS}`, ...(namespaces ?? [])])

        if (
          localeStructure.indexOf(`${prefix}lng${suffix}`) >
          localeStructure.indexOf(`${prefix}ns${suffix}`)
        ) {
          throw new Error(
            'Must provide all namespaces in ns option if using a localeStructure that is not namespace-listable like lng/ns'
          )
        }

        console.log('namespaces', getNamespaces())

        combinedConfig.ns = getNamespaces()
      }
    }
  } else {
    //
    // Set client side backend, if there is no custom backend
    //
    if (!hasCustomBackend) {
      if (typeof localePath === 'string') {
        combinedConfig.backend = {
          addPath: `${localePath}/${localeStructure}.missing.${localeExtension}`,
          loadPath: `${localePath}/${localeStructure}.${localeExtension}`,
        }
      } else if (typeof localePath === 'function') {
        combinedConfig.backend = {
          addPath: (locale: string, namespace: string) =>
            localePath(locale, namespace, true),
          loadPath: (locale: string, namespace: string) =>
            localePath(locale, namespace, false),
        }
      }
    }

    if (
      typeof combinedConfig.ns !== 'string' &&
      !Array.isArray(combinedConfig.ns)
    ) {
      combinedConfig.ns = [defaultNS as string]
    }
  }

  //
  // Deep merge with overwrite - goes last
  //
  deepMergeObjects.forEach(obj => {
    if (userConfig[obj]) {
      combinedConfig[obj] = {
        ...combinedConfig[obj],
        ...userConfig[obj],
      }
    }
  })

  return combinedConfig as InternalConfig
}
