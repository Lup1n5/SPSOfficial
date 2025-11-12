const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const pngToIcoModule = require('png-to-ico')
const pngToIco = pngToIcoModule.default || pngToIcoModule.imagesToIco || pngToIcoModule

const iconsDir = path.resolve('icons')

async function ensureDir() {
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })
}

async function generate() {
  await ensureDir()

  const src512 = path.join(iconsDir, '512.png')
  const outApple = path.join(iconsDir, 'apple-touch-icon.png')
  const appleSizes = [
    { size: 180, file: 'apple-touch-icon-180x180.png' }, // iPhone Retina HD
    { size: 167, file: 'apple-touch-icon-167x167.png' }, // iPad Pro
    { size: 152, file: 'apple-touch-icon-152x152.png' }, // iPad
    { size: 120, file: 'apple-touch-icon-120x120.png' }, // iPhone Retina
  ]
  const out32 = path.join(iconsDir, 'favicon-32x32.png')
  const out16 = path.join(iconsDir, 'favicon-16x16.png')
  const outIco = path.join(iconsDir, 'favicon.ico')

  try {
    if (fs.existsSync(src512)) {
      // default apple-touch-icon.png (180x180)
      await sharp(src512).resize(180, 180, { fit: 'cover' }).png().toFile(outApple)
      console.log('Created', outApple)
      // additional sized variants
      for (const { size, file } of appleSizes) {
        const out = path.join(iconsDir, file)
        await sharp(src512).resize(size, size, { fit: 'cover' }).png().toFile(out)
        console.log('Created', out)
      }
    } else {
      console.warn(src512, 'not found; skipping apple-touch-icon generation')
    }
  } catch (e) {
    console.error('Failed to create apple-touch-icon variants:', e.message || e)
  }

  try {
    const src32 = path.join(iconsDir, '32.png')
    if (fs.existsSync(src32)) {
      await sharp(src32).png().toFile(out32)
      console.log('Created', out32)
    }
  } catch (e) {
    console.error('Failed to create favicon-32x32:', e.message || e)
  }

  try {
    const src16 = path.join(iconsDir, '16.png')
    if (fs.existsSync(src16)) {
      await sharp(src16).png().toFile(out16)
      console.log('Created', out16)
    }
  } catch (e) {
    console.error('Failed to create favicon-16x16:', e.message || e)
  }

  try {
    const sources = []
    if (fs.existsSync(out16)) sources.push(out16)
    if (fs.existsSync(out32)) sources.push(out32)
    if (sources.length) {
      const buf = await pngToIco(sources)
      fs.writeFileSync(outIco, buf)
      console.log('Created', outIco)
    } else {
      console.warn('No PNG sources for favicon.ico')
    }
  } catch (e) {
    console.error('Failed to create favicon.ico:', e.message || e)
  }
}

generate().then(()=>console.log('generate-icons-sharp done')).catch(err=>{console.error(err); process.exit(1)})
