async function check() {
  // Check CSS
  const cssRes = await fetch('http://localhost:3111/_next/static/css/app/layout.css?v=1787248518941')
  console.log('CSS status:', cssRes.status)
  const cssText = await cssRes.text()
  console.log('CSS size:', cssText.length, 'bytes')
  console.log('Has tailwind utilities:', cssText.includes('min-h-full') || cssText.includes('flex-col'))
  console.log('CSS first 500:', cssText.slice(0, 500))

  // Check JS chunks
  const jsRes = await fetch('http://localhost:3111/_next/static/chunks/app/page.js?v=1787248518941')
  console.log('\nJS status:', jsRes.status)
  const jsText = await jsRes.text()
  console.log('JS size:', jsText.length, 'bytes')

  // Check admin page
  const adminRes = await fetch('http://localhost:3111/admin')
  console.log('\nAdmin page status:', adminRes.status)
  const adminHtml = await adminRes.text()
  console.log('Admin HTML size:', adminHtml.length, 'bytes')
  console.log('Has Tailwind classes:', adminHtml.includes('text-slate-'))
  console.log('Admin body first 500:', adminHtml.slice(adminHtml.indexOf('<body'), adminHtml.indexOf('<body') + 500))
}
check()
