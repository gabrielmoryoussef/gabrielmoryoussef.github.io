import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { iconSvg } from '@/lib/motif';

/** A 32×32 PNG wrapped in an ICO container (valid since Windows Vista; every browser reads it). */
export const GET: APIRoute = async () => {
  const png = await sharp(Buffer.from(iconSvg(32, { bg: '#f4f0e6', ink: '#1c1b18', accent: '#b8341b' })))
    .png()
    .toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count
  header.writeUInt8(32, 6); // width
  header.writeUInt8(32, 7); // height
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(png.length, 14); // size
  header.writeUInt32LE(22, 18); // offset
  return new Response(new Uint8Array(Buffer.concat([header, png])), { headers: { 'Content-Type': 'image/x-icon' } });
};
