/* tslint:disable no-explicit-any */
import {
  i18n as I18NextClient,
  TFunction as I18NextTFunction,
  InitOptions,
  TypeOptions,
} from 'i18next'
import {
  I18nContext,
  WithTranslation as ReactI18nextWithTranslation,
  Trans,
  Translation,
  useTranslation,
  withTranslation,
} from 'react-i18next'
import { appWithTranslation, i18n } from './'

/**
 * Inlined from `import('next').NextConfig.i18n` v13.0.6. As we support
 * multiple nextjs versions it's safer to inline and keep it up-to-date.
 */
type NextJsI18NConfig = {
  defaultLocale: string
  domains?: {
    defaultLocale: string
    domain: string
    http?: true
    locales?: string[]
  }[]
  localeDetection?: false
  locales: string[]
}

type DefaultNamespace = TypeOptions['defaultNS']

export type UserConfig = {
  i18n: NextJsI18NConfig
  localeExtension?: string
  localePath?:
    | string
    | ((
        locale: string,
        namespace: string,
        missing: boolean
      ) => string)
  localeStructure?: string
  namespaces?: string[]
  onPreInitI18next?: (i18n: I18n) => void
  reloadOnPrerender?: boolean
  serializeConfig?: boolean
  use?: any[]
} & InitOptions

export type InternalConfig = Omit<UserConfig, 'i18n'> &
  NextJsI18NConfig & {
    errorStackTraceLimit: number
    preload: string[]
    supportedLngs: string[]
  }

export type UseTranslation = typeof useTranslation
export type AppWithTranslation = typeof appWithTranslation
export type TFunction = I18NextTFunction
export type I18n = I18NextClient
export type WithTranslationHocType = typeof withTranslation
export type WithTranslation = ReactI18nextWithTranslation
export type InitPromise = Promise<TFunction>
export type CreateClientReturn = {
  i18n: I18n
  initPromise: InitPromise
}

export type SSRConfig = {
  _nextI18Next?: {
    initialI18nStore: any
    initialLocale: string
    ns: string[]
    userConfig: UserConfig | null
  }
}

export {
  i18n,
  I18nContext,
  appWithTranslation,
  useTranslation,
  Trans,
  Translation,
  withTranslation,
  DefaultNamespace,
}
