"use strict";
export function isGzip(ab) {
  const buf = new Uint8Array(ab);
  if (!buf || buf.length < 3) {
    return false;
  }
  return buf[0] === 31 && buf[1] === 139 && buf[2] === 8;
}
export async function arrayBufferToString(ab) {
  if (isGzip(ab)) {
    return await decompress(ab);
  }
  const str = new TextDecoder("utf-8").decode(ab);
  return str;
}
export async function fileToString(file) {
  let stream = file.stream();
  if (file.type.endsWith("gzip")) {
    stream = decompressStream(stream);
  }
  const arrayBuffer = await new Response(stream).arrayBuffer();
  const str = new TextDecoder("utf-8").decode(arrayBuffer);
  return str;
}
export async function decompress(gzippedBuffer, charset = "utf-8") {
  const buffer = await gzipCodec(gzippedBuffer, new DecompressionStream("gzip"));
  const str = new TextDecoder(charset).decode(buffer);
  return str;
}
export async function decompressDeflate(buffer, charset = "utf-8") {
  let decompressedBuffer;
  try {
    decompressedBuffer = await gzipCodec(buffer, new DecompressionStream("deflate"));
  } catch {
    decompressedBuffer = await gzipCodec(buffer, new DecompressionStream("deflate-raw"));
  }
  return new TextDecoder(charset).decode(decompressedBuffer);
}
export async function compress(str) {
  const encoded = new TextEncoder().encode(str);
  const buffer = await gzipCodec(encoded, new CompressionStream("gzip"));
  return buffer;
}
async function gzipCodec(buffer, codecStream) {
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer);
      controller.close();
    }
  });
  const codecReadable = readable.pipeThrough(codecStream);
  return await new Response(codecReadable).arrayBuffer();
}
export function decompressStream(stream) {
  const ds = new DecompressionStream("gzip");
  return stream.pipeThrough(ds);
}
export function compressStream(stream) {
  const cs = new CompressionStream("gzip");
  return stream.pipeThrough(cs);
}
export function createMonitoredStream(stream, onProgress) {
  let bytesRead = 0;
  const progressTransformer = new TransformStream({
    transform(chunk, controller) {
      bytesRead += chunk.byteLength;
      onProgress(bytesRead);
      controller.enqueue(chunk);
    }
  });
  return stream.pipeThrough(progressTransformer);
}
//# sourceMappingURL=Gzip.js.map
