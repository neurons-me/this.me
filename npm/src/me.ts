// me.core.ts
import { keccak256 } from "js-sha3"
export class MECore {
  email: string
  secret: string
  username?: string
  identityRoot?: string
  constructor({ email, secret, username }: { email: string; secret: string; username?: string }) {
    this.email = email
    this.secret = secret
    this.username = username
  }

  deriveIdentity(namespace: string) {
    const input = this.secret + namespace
    this.identityRoot = "0x" + keccak256(input)
    return this.identityRoot
  }

  sign(message: string) {
    return "0x" + keccak256(this.secret + message)
  }

  verify(namespace: string) {
    const expected = "0x" + keccak256(this.secret + namespace)
    return expected === this.identityRoot
  }
}