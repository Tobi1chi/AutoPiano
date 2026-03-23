const loadedScripts = {}
const loadedModules = {}

export function loadScript(url) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error(`Cannot load script outside browser: ${url}`))
  }

  if (loadedScripts[url]) {
    return loadedScripts[url]
  }

  loadedScripts[url] = new Promise((resolve, reject) => {
    const existingTag = document.querySelector(`script[data-autopiano-src="${url}"]`)
    if (existingTag) {
      existingTag.addEventListener('load', resolve, { once: true })
      existingTag.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.dataset.autopianoSrc = url
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`))
    document.head.appendChild(script)
  })

  return loadedScripts[url]
}

export function loadModule(url) {
  if (loadedModules[url]) {
    return loadedModules[url]
  }

  loadedModules[url] = new Function('moduleUrl', 'return import(moduleUrl)')(url)
  return loadedModules[url]
}
