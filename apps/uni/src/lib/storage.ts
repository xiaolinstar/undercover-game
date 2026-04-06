import { createJsonStorage, createUniStorageDriver } from '@undercover/storage'

const { readJson, writeJson, removeKey } = createJsonStorage(createUniStorageDriver())

export { readJson, removeKey, writeJson }
