import { createJsonStorage, createWebStorageDriver } from '@undercover/storage'

const { readJson, writeJson, removeKey } = createJsonStorage(createWebStorageDriver())

export { readJson, removeKey, writeJson }
