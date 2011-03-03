div id: 'top', ->
  for color in ['black', 'red']
    img src: '/static/img/bump4_arrow_#{color}.png', id: '#{color}_arrow'
    div id: '#{color}_move'
    p id: '#{color}_text'

ol id: 'cols', ->
  li '#{i}' for i in [0..6]

audio id: 'a{#}', src: '/static/audio/sound_row#{i}.mp3' for i in [0..5]
audio id: 'a_quit', src: '/static/audio/sound_quit_button.mp3'
audio id: 'a_win', src: '/static/audio/sounds_youwin.mp3'

script type: 'text/javascript', src: 'script.js'

