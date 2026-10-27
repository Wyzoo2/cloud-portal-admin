/**
 * 复制文本。
 * navigator.clipboard 只在安全上下文（HTTPS / localhost）可用，
 * 内网 http://IP 访问时它是 undefined，必须回退到 execCommand。
 */
export async function copyText(text) {
  if (!text) return false

  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (e) {
      // 权限被拒等情况，落到下面的兜底
    }
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch (e) {
    return false
  }
}
