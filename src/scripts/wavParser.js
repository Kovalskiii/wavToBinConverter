export function wavParser(byteString) {
  let chunkID =
    byteString.charAt(0) +
    byteString.charAt(1) +
    byteString.charAt(2) +
    byteString.charAt(3);

  const format =
    byteString.charAt(8) +
    byteString.charAt(9) +
    byteString.charAt(10) +
    byteString.charAt(11);

  let subChunk1ID =
    byteString.charAt(12) +
    byteString.charAt(13) +
    byteString.charAt(14) +
    byteString.charAt(15);

  if (chunkID != "RIFF" || format != "WAVE" || subChunk1ID != "fmt ") {
    console.error("Wrong type of file!");
    return;
  }
  let fileSize =
    byteString.charCodeAt(7).toString(16) +
    byteString.charCodeAt(6).toString(16) +
    byteString.charCodeAt(5).toString(16) +
    byteString.charCodeAt(4).toString(16);
  const chunkSize = parseInt(fileSize, 16);

  let length =
    byteString.charCodeAt(19).toString(16) +
    byteString.charCodeAt(18).toString(16) +
    byteString.charCodeAt(17).toString(16) +
    byteString.charCodeAt(16).toString(16);
  const subChunk1Size = parseInt(length, 16);

  let formatType =
    byteString.charCodeAt(21).toString(16) +
    byteString.charCodeAt(20).toString(16);
  const audioFormat = parseInt(formatType, 16);

  let channels =
    byteString.charCodeAt(23).toString(16) +
    byteString.charCodeAt(22).toString(16);
  const numChannels = parseInt(channels, 16);

  let sampleRateRaw =
    byteString.charCodeAt(27).toString(16) +
    byteString.charCodeAt(26).toString(16) +
    byteString.charCodeAt(25).toString(16) +
    byteString.charCodeAt(24).toString(16);
  const sampleRate = parseInt(sampleRateRaw, 16);

  let byteRateRaw =
    byteString.charCodeAt(31).toString(16) +
    byteString.charCodeAt(30).toString(16) +
    byteString.charCodeAt(29).toString(16) +
    byteString.charCodeAt(28).toString(16);
  const byteRate = parseInt(byteRateRaw, 16);

  let BlockAlignRaw =
    byteString.charCodeAt(33).toString(16) +
    byteString.charCodeAt(32).toString(16);
  const blockAlign = parseInt(BlockAlignRaw, 16);

  let bitsPerSampleRaw =
    byteString.charCodeAt(35).toString(16) +
    byteString.charCodeAt(34).toString(16);
  const bitsPerSample = parseInt(bitsPerSampleRaw, 16);

  const subChunk2ID =
    byteString.charAt(36) +
    byteString.charAt(37) +
    byteString.charAt(38) +
    byteString.charAt(39);

  let sizeOfData =
    byteString.charCodeAt(43).toString(16) +
    byteString.charCodeAt(42).toString(16) +
    byteString.charCodeAt(41).toString(16) +
    byteString.charCodeAt(40).toString(16);
  const subChunk2Size = parseInt(sizeOfData, 16);

  return {
    chunkID,
    chunkSize,
    format,
    subChunk1ID,
    subChunk1Size,
    audioFormat,
    numChannels,
    sampleRate,
    byteRate,
    blockAlign,
    bitsPerSample,
    subChunk2ID,
    subChunk2Size,
  };
}
