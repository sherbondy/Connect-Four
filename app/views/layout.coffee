!!! 5
html(manifest='cache-manifest')
  head
    meta(charset='utf-8')
    meta(name='viewport', content='width=device-width, initial-scale=1, maximum-scale=1')
    meta(name='apple-mobile-web-app-capable', content='yes')

    link(rel='stylesheet', type:'text/css', href:'/static/style.css')
    link(rel='apple-touch-icon', href='/static/img/icon.png')
    link(rel='apple-touch-startup-image', href='/static/img/default.png')

    title Browser Bump Four

    script(type='text/javascript', src='/static/zepto.min.js')

  body ->
    @body
