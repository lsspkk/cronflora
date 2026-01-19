const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

const srcDir = path.join(__dirname, 'src')
const distDir = path.join(__dirname, 'dist')

// Find all function directories (directories with function.json)
const functionDirs = fs.readdirSync(srcDir).filter(dir => {
  const dirPath = path.join(srcDir, dir)
  return fs.statSync(dirPath).isDirectory() &&
         fs.existsSync(path.join(dirPath, 'function.json'))
})

async function build() {
  // Clean dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true })
  }
  fs.mkdirSync(distDir, { recursive: true })

  // Bundle each function
  for (const funcName of functionDirs) {
    const entryPoint = path.join(srcDir, funcName, 'index.ts')
    const outDir = path.join(distDir, funcName)

    fs.mkdirSync(outDir, { recursive: true })

    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: path.join(outDir, 'index.js'),
      format: 'cjs',
      sourcemap: true,
      external: ['@azure/functions'], // Keep as external - SWA provides it
    })

    // Copy function.json
    fs.copyFileSync(
      path.join(srcDir, funcName, 'function.json'),
      path.join(outDir, 'function.json')
    )

    console.log(`Bundled: ${funcName}`)
  }

  // Copy host.json
  fs.copyFileSync(
    path.join(srcDir, 'host.json'),
    path.join(distDir, 'host.json')
  )

  // Copy package.json and package-lock.json for SWA to install @azure/functions
  fs.copyFileSync(
    path.join(__dirname, 'package.json'),
    path.join(distDir, 'package.json')
  )
  if (fs.existsSync(path.join(__dirname, 'package-lock.json'))) {
    fs.copyFileSync(
      path.join(__dirname, 'package-lock.json'),
      path.join(distDir, 'package-lock.json')
    )
  }

  console.log('Build complete!')
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
