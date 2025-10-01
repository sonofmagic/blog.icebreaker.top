import fsp from 'node:fs/promises'
import path from 'node:path'

const privateRepositoryPath = path.resolve(
  import.meta.dirname,
  '../../article/content',
)
const currentDir = path.resolve(import.meta.dirname, '..', 'content')
  ; (async () => {
  await fsp.symlink(privateRepositoryPath, currentDir, 'dir')
})()
