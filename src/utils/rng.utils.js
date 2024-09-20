const defaultMW = 123456789
const defaultMZ = 987654321

// Implementation extracted from: https://stackoverflow.com/a/19301306/2258875

export class RNG {
  mw = defaultMW
  mz = defaultMZ
  mask = 0xffffffff

  constructor (seed) {
    this.mw = (defaultMW + seed) & this.mask
    this.mz = (defaultMZ - seed) & this.mask
  }

  /**
   * Return numbers between 0 & 1 inclusive
   * @returns {number}
   */
  random () {
    this.mz = (36969 * (this.mz & 65535) + (this.mz >> 16)) & this.mask
    this.mw = (18000 * (this.mw & 65535) + (this.mw >> 16)) & this.mask

    const result = ((this.mz << 16) + (this.mw & 65535)) >>> 0
    return result / 4294967296
  }
}
