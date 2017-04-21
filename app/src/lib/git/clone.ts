import { git, envForAuthentication, IGitExecutionOptions } from './core'
import { Account } from '../../models/account'
import { ICloneProgress } from '../app-state'
import { CloneProgressParser, executionOptionsWithProgress } from '../progress'

/** Additional arguments to provide when cloning a repository */
export type CloneOptions = {
  /** The optional identity to provide when cloning. */
  readonly account: Account | null
  /** The branch to checkout after the clone has completed. */
  readonly branch?: string
}

/** Clone the repository to the path. */
export async function clone(url: string, path: string, options: CloneOptions, progressCallback?: (progress: ICloneProgress) => void): Promise<void> {
  const env = envForAuthentication(options.account)

  const args = [ 'clone', '--recursive' ]
  let opts: IGitExecutionOptions = { env }

  if (progressCallback) {
    args.push('--progress')

    const title = `Cloning into ${path}`
    const kind = 'clone'

    opts = executionOptionsWithProgress(opts, new CloneProgressParser(), (progress) =>{
      const description = progress.kind === 'progress'
        ? progress.details.text
        : progress.text
      const value = progress.percent

      progressCallback({ kind, title, description, value })
    })

    // Initial progress
    progressCallback({ kind, title, value: 0 })
  }

  if (options.branch) {
    args.push('-b', options.branch)
  }

  args.push('--', url, path)

  await git(args, __dirname, 'clone', opts)
}
