(function() {
  doctype(5);
  html(function() {
    head(function() {
      meta({
        charset: 'utf-8'
      });
      meta({
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1'
      });
      meta({
        name: 'apple-mobile-web-app-capable',
        content: 'yes'
      });
      link({
        rel: 'stylesheet',
        type: 'text/css',
        href: '/static/style.css'
      });
      link({
        rel: 'apple-touch-icon',
        href: '/static/img/icon.png'
      });
      link({
        rel: 'apple-touch-startup-image',
        href: '/static/img/default.png'
      });
      title('Browser Bump Four');
      return script({
        type: 'text/javascript',
        src: '/static/zepto.min.js'
      });
    });
    return body(function() {
      return this.body;
    });
  });
}).call(this);
