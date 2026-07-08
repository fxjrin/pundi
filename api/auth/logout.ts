import { json } from '../_lib/response.js'
import { buildClearAuthCookie } from '../_lib/auth.js'

export async function POST(): Promise<Response> {
  return json({ message: 'Logged out' }, 200, { 'Set-Cookie': buildClearAuthCookie() })
}
