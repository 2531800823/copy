const fs = require('node:fs')
const path = require('node:path')
const pngToIco = require('png-to-ico')

const files = ['16x16.png', '32x32.png', '48x48.png', '256x256.png', '512x512.png', '1024x1024.png']

/**
 * 生成 Windows ico 图标文件
 * @param {string[]} pngPaths - PNG 文件路径数组，建议尺寸有 16,32,48,64,128,256
 * @param {string} outputPath - 输出 ico 文件路径
 * @returns {Promise<void>}
 */
async function generateIco(pngPaths, outputPath) {
  try {
    const icoBuffer = await pngToIco(pngPaths)
    fs.writeFileSync(outputPath, icoBuffer)
    console.log(`成功生成ico文件: ${outputPath}`)
  }
  catch (err) {
    console.error('生成ico文件失败:', err)
  }
}

async function run() {
  const pngs = [
    ...files.map(file => path.join(__dirname, `../build/icons/png/${file}`)),
  ]
  console.log('🚀 liu123 ~ pngs:', pngs)
  const output = path.join(__dirname, '../build/icons/win/icon.ico')

  await generateIco(pngs[4], output)
}

run()
