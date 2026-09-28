import got from 'got'

import { logger } from './powertools'

// Starts the `Web` workflow so the static site is rebuilt as soon as fresh
// screenings have been written to S3. This replaces the daily `schedule:`
// trigger in web.yml, which GitHub started delaying by 5+ hours.
//
// Requires a fine-grained GitHub token scoped to this repository with the
// "Actions: Read and write" permission. Without a token it only warns, as the
// site won't be rebuilt; local runs don't call this at all.
const REPOSITORY = 'ckuijjer/expatcinema.com'
const WORKFLOW = 'web.yml'
const REF = 'main'

export const triggerWebDeploy = async () => {
  const token = process.env.WEB_DEPLOY_TOKEN
  if (!token) {
    logger.warn('skipping web deploy trigger, no WEB_DEPLOY_TOKEN set')
    return
  }

  try {
    await got.post(
      `https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        json: { ref: REF },
        retry: { limit: 3, methods: ['POST'] },
      },
    )
    logger.info('triggered web deploy', { workflow: WORKFLOW, ref: REF })
  } catch (error) {
    // Logged as an error so it reaches Slack: without this the site won't be
    // rebuilt with today's screenings.
    logger.error('failed triggering web deploy', { error })
  }
}
