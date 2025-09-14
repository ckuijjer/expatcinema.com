import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

const MODEL_ID = 'eu.amazon.nova-micro-v1:0'

export const useLLM = async (prompt: string) => {
  const bedrockClient = new BedrockRuntimeClient({ region: 'eu-west-1' })

  const modelInput = {
    messages: [
      {
        role: 'user',
        content: [
          {
            text: prompt,
          },
        ],
      },
    ],
  }

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(modelInput),
  })

  const response = await bedrockClient.send(command)
  const parsedBody = JSON.parse(new TextDecoder().decode(response.body))

  const result = parsedBody.output?.message?.content?.[0]?.text
  return result
}
