const fs = require('fs')
const pngToIcoModule = require('png-to-ico')
const pngToIco = pngToIcoModule.default || pngToIcoModule.imagesToIco || pngToIcoModule
const path = require('path')

const iconsDir = path.resolve('icons')

async function ensureDir() {
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })
}

async function generate() {
  await ensureDir()

  const src512 = path.join(iconsDir, '512.png')
  const src32 = path.join(iconsDir, '32.png')
  const src16 = path.join(iconsDir, '16.png')

  // If resizing tools are not available, copy existing images as sensible fallbacks
  try {
    // apple-touch-icon: copy the 192 or 512 PNG as a fallback (iOS will scale it)
    const appleSrc = fs.existsSync(path.join(iconsDir, '192.png')) ? path.join(iconsDir, '192.png') : src512
    fs.copyFileSync(appleSrc, path.join(iconsDir, 'apple-touch-icon.png'))
    console.log('Copied apple-touch-icon.png from', appleSrc)
  } catch (e) {
    console.error('Failed to create apple-touch-icon.png:', e.message || e)
  }

  try {
    if (fs.existsSync(src32)) fs.copyFileSync(src32, path.join(iconsDir, 'favicon-32x32.png'))
    console.log('Copied favicon-32x32.png')
  } catch (e) {
    console.error('Failed to create favicon-32x32.png:', e.message || e)
  }

  try {
    if (fs.existsSync(src16)) fs.copyFileSync(src16, path.join(iconsDir, 'favicon-16x16.png'))
    console.log('Copied favicon-16x16.png')
  } catch (e) {
    console.error('Failed to create favicon-16x16.png:', e.message || e)
  }

  // Create favicon.ico from 16 and 32
  try {
    const icoPath = path.join(iconsDir, 'favicon.ico')
    const sources = []
    if (fs.existsSync(path.join(iconsDir, 'favicon-16x16.png'))) sources.push(path.join(iconsDir, 'favicon-16x16.png'))
    if (fs.existsSync(path.join(iconsDir, 'favicon-32x32.png'))) sources.push(path.join(iconsDir, 'favicon-32x32.png'))
    if (sources.length) {
      const buf = await pngToIco(sources)
      fs.writeFileSync(icoPath, buf)
      console.log('Created favicon.ico')
    } else {
      console.warn('No PNG sources found for favicon.ico creation')
    }
  } catch (e) {
    console.error('Failed to create favicon.ico:', e.message || e)
  }
}

generate()
  .then(() => console.log('Done'))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
