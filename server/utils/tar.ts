const BLOCK_SIZE = 512

function encodeOctal(value: number, length: number): string {
  return value.toString(8).padStart(length - 1, '0') + '\0'
}

function createHeader(filename: string, size: number): Uint8Array {
  const header = new Uint8Array(BLOCK_SIZE)
  const encoder = new TextEncoder()

  const writeStr = (str: string, offset: number, len: number) => {
    const bytes = encoder.encode(str)
    header.set(bytes.subarray(0, len), offset)
  }

  writeStr(filename, 0, 100)
  writeStr(encodeOctal(0o644, 8), 100, 8)    // mode
  writeStr(encodeOctal(0, 8), 108, 8)        // uid
  writeStr(encodeOctal(0, 8), 116, 8)        // gid
  writeStr(encodeOctal(size, 12), 124, 12)   // size
  writeStr(encodeOctal(Math.floor(Date.now() / 1000), 12), 136, 12) // mtime
  writeStr('        ', 148, 8)               // checksum placeholder (spaces)
  header[156] = 0x30                         // '0' = regular file
  writeStr('ustar\0', 257, 6)               // magic
  writeStr('00', 263, 2)                     // version

  let checksum = 0
  for (let i = 0; i < BLOCK_SIZE; i++) {
    checksum += header[i]
  }
  writeStr(encodeOctal(checksum, 7) + ' ', 148, 8)

  return header
}

export function createTar(files: Record<string, string>, prefix: string): Uint8Array {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []

  for (const [name, content] of Object.entries(files)) {
    const data = encoder.encode(content)
    const path = prefix ? `${prefix}/${name}` : name
    parts.push(createHeader(path, data.length))
    parts.push(data)

    const remainder = data.length % BLOCK_SIZE
    if (remainder > 0) {
      parts.push(new Uint8Array(BLOCK_SIZE - remainder))
    }
  }

  parts.push(new Uint8Array(BLOCK_SIZE * 2))

  let totalLen = 0
  for (const p of parts) totalLen += p.length
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const p of parts) {
    result.set(p, offset)
    offset += p.length
  }
  return result
}

export async function gzip(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  writer.write(data)
  writer.close()

  const reader = cs.readable.getReader()
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  let totalLen = 0
  for (const c of chunks) totalLen += c.length
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const c of chunks) {
    result.set(c, offset)
    offset += c.length
  }
  return result
}
