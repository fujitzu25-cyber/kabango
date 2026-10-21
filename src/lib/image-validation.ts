export async function validateImage(file: File) {
  if (file.size > 2097152 || !/\.(jpe?g|png|webp)$/i.test(file.name))
    return false;
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === "image/jpeg")
    return b[0] === 255 && b[1] === 216 && b[2] === 255;
  if (file.type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v);
  return (
    file.type === "image/webp" &&
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP"
  );
}
