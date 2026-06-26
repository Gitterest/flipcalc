import type { IncomingMessage, ServerResponse } from 'node:http'
import { getDefaultFlipCalcApi } from '../../server/flipcalc/defaultApi'

async function readRequestBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

function requestUrl(request: IncomingMessage): string {
  const protocol = request.headers['x-forwarded-proto'] ?? 'https'
  const host = request.headers.host ?? 'localhost'

  return `${protocol}://${host}${request.url ?? '/'}`
}

function requestHeaders(request: IncomingMessage): Headers {
  const headers = new Headers()

  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '))
    } else if (value !== undefined) {
      headers.set(key, value)
    }
  }

  return headers
}

async function sendResponse(response: Response, serverResponse: ServerResponse): Promise<void> {
  serverResponse.statusCode = response.status
  response.headers.forEach((value, key) => {
    serverResponse.setHeader(key, value)
  })

  const body = Buffer.from(await response.arrayBuffer())
  serverResponse.end(body)
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readRequestBody(request)
  const fetchRequest = new Request(requestUrl(request), {
    method: request.method,
    headers: requestHeaders(request),
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : body
  })

  const fetchResponse = await getDefaultFlipCalcApi()(fetchRequest)

  await sendResponse(fetchResponse, response)
}
