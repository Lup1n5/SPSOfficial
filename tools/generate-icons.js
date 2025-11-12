import Jimp from 'jimp'
import fs from 'fs'
import pngToIco from 'png-to-ico'
import path from 'path'

const iconsDir = path.resolve('icons')

async function ensureDir() {
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })
}

async function generate() {
  await ensureDir()

  const src512 = path.join(iconsDir, '512.png')
  const src32 = path.join(iconsDir, '32.png')
  const src16 = path.join(iconsDir, '16.png')

  // apple-touch-icon 180x180
  try {
    const image = await Jimp.read(src512)
    await image.cover(180, 180).writeAsync(path.join(iconsDir, 'apple-touch-icon.png'))
    console.log('Created apple-touch-icon.png')
  } catch (e) {
    console.error('Failed to create apple-touch-icon.png:', e.message)
  }

  // favicon-32x32 and favicon-16x16 (copy/resize)
  try {
    const img32 = await Jimp.read(src32)
    await img32.writeAsync(path.join(iconsDir, 'favicon-32x32.png'))
    console.log('Created favicon-32x32.png')
  } catch (e) {
    console.error('Failed to create favicon-32x32.png:', e.message)
  }

  try {
    const img16 = await Jimp.read(src16)
    await img16.writeAsync(path.join(iconsDir, 'favicon-16x16.png'))
    console.log('Created favicon-16x16.png')
  } catch (e) {
    console.error('Failed to create favicon-16x16.png:', e.message)
  }

  // Create favicon.ico from 16 and 32
  try {
    const icoPath = path.join(iconsDir, 'favicon.ico')
    const buf = await pngToIco([path.join(iconsDir, 'favicon-16x16.png'), path.join(iconsDir, 'favicon-32x32.png')])
    fs.writeFileSync(icoPath, buf)
    console.log('Created favicon.ico')
  } catch (e) {
    console.error('Failed to create favicon.ico:', e.message)
  }
}

generate()
  .then(() => console.log('Done'))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
