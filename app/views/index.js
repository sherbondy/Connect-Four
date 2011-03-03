(function() {
  var i;
  div({
    id: 'top'
  }, function() {
    var color, _i, _len, _ref, _results;
    _ref = ['black', 'red'];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      color = _ref[_i];
      img({
        src: '/static/img/bump4_arrow_#{color}.png',
        id: '#{color}_arrow'
      });
      div({
        id: '#{color}_move'
      });
      _results.push(p({
        id: '#{color}_text'
      }));
    }
    return _results;
  });
  ol({
    id: 'cols'
  }, function() {
    var i, _results;
    _results = [];
    for (i = 0; i <= 6; i++) {
      _results.push(li('#{i}'));
    }
    return _results;
  });
  audio({
    id: 'a{#}',
    src: (function() {
      var _results;
      _results = [];
      for (i = 0; i <= 5; i++) {
        _results.push('/static/audio/sound_row#{i}.mp3');
      }
      return _results;
    })()
  });
  audio({
    id: 'a_quit',
    src: '/static/audio/sound_quit_button.mp3'
  });
  audio({
    id: 'a_win',
    src: '/static/audio/sounds_youwin.mp3'
  });
  script({
    type: 'text/javascript',
    src: 'script.js'
  });
}).call(this);
