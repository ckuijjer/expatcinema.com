import { mkdir, writeFile } from 'fs/promises'

const downloadAndSaveJson = async (file) => {
  const json = await (
    await fetch(
      `https://s3-eu-west-1.amazonaws.com/expatcinema-public-prod/${file}`,
    )
  ).json()

  await mkdir('../data/screenings', { recursive: true })
  await writeFile(`../data/screenings/${file}`, JSON.stringify(json, null, 2))
}

await downloadAndSaveJson('screenings-with-metadata.json')
await downloadAndSaveJson('screenings-without-metadata.json')
