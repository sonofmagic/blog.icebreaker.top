import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const privateRepositoryPath = path.resolve(
  import.meta.dirname,
  '../../article/content',
)
const currentDir = path.resolve(import.meta.dirname, '..', 'content')

async function syncArticles() {
  let sourceStat
  try {
    sourceStat = await fsp.stat(privateRepositoryPath)
  }
  catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `Article content is missing at ${privateRepositoryPath}. Initialize the submodule first with `
        + '`git submodule update --init --recursive`.',
      )
    }
    throw error
  }

  if (!sourceStat.isDirectory()) {
    throw new Error(`Article content path is not a directory: ${privateRepositoryPath}`)
  }

  try {
    const currentStat = await fsp.lstat(currentDir)
    if (!currentStat.isSymbolicLink()) {
      throw new Error(
        `Cannot sync articles because ${currentDir} already exists and is not a symbolic link. `
        + 'Remove it and run the sync command again.',
      )
    }

    const linkTarget = await fsp.readlink(currentDir)
    const resolvedTarget = path.resolve(path.dirname(currentDir), linkTarget)
    if (resolvedTarget === privateRepositoryPath) {
      return
    }

    await fsp.unlink(currentDir)
  }
  catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
      throw error
    }
  }

  await fsp.symlink(privateRepositoryPath, currentDir, 'dir')
}

syncArticles().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
