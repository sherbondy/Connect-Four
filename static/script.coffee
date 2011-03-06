prev_a = false       # previous acceleration value
waiting = false      # waiting for a bump
playing = false      # playing a game?
prev = 0

Array::real_len = ->
    if not this.length
        0
    else
        n = 0
        (n += 1 for i in [0..this.length-1] when this[i] isnt 0)
        n

pause_audio = ->
    for item in document.getElementsByTagName('audio')
        item.pause()
        true

socket = new io.Socket null, {port:3000}
socket.connect()

socket.on 'connect', ->
    socket.send 'hey buddy!'
socket.on 'message', (obj)->
    console.log obj


board =
    # create a 7x6 matrix

    h: 325 # board height
    matrix: []
    turn: 0 # player turn, either 1 (red) or 2 (blue)
    turn_text: [null, 'red', 'black']
    turns: 0 # total number of turns in the game

    new_matrix: ->
        (0 for i in [0..5] for j in [0..6])

    place: ->
        if playing
            row = 0
            col = ball.col
            added = false
            dist = this.h

            this.matrix[col].reverse()
            for i in [0.. this.matrix[col].length - 1]
                if not added and this.matrix[col][i] is 0
                    this.matrix[col][i] = this.turn
                    dist -= ball.w*(i+1) + (this.matrix[col].real_len()-5)
                    added = true
                    row = i
                    break

            this.matrix[col].reverse()
            # only create a new ball if there was actually space to add
            if added
                if pause_audio()
                    document.getElementById('a'+row).play()
                ball.drop(dist)

    highlight_col: (x) ->
        if playing
            ball.col = parseInt (x) / ball.w

            $('#cols li').removeClass('highlight')
            $('#c'+ball.col).addClass('highlight')

    new_turn: ->
        $('#cols li').removeClass('highlight')

        this.turn = (this.turns % 2) + 1
        this.turns += 1

        color = this.turn_text[this.turn]

        $('#black_arrow, #red_arrow').hide()
        $('#'+color+'_arrow').show()

        $('#black_move, #red_move').removeClass('glow')
        $('#'+color+'_move').addClass('glow')
        $('#black_text, #red_text').text('')
        $('#'+color+'_text').text(color+' player\'s turn.')
        this.check_win()

    check_win: ->
        winner = false

        if this.turns is 43
            if confirm 'Game ended in a draw. New game?'
                this.new_game()
        # cannot possibly win in fewer than 8 turns
        if this.turns > 7
            # list of lists to evaluate for 4 in a row
            to_check = []

            for j in [0..6]
                # get rid of entries that can't possibly have winners
                if this.matrix[j].real_len() > 3
                    # columns
                    to_check.push(this.matrix[j])

            for i in [0..5]
                row = (this.matrix[j][i] for j in [0..6])
                if row.real_len() > 3
                    to_check.push(row)

            # diagonals from bottom left to top right
            ld_arrs = [[0,3], [0,4], [0,5], [1,5], [2,5], [3,5]]
            for coords in ld_arrs
                c = coords
                diag_list = []
                while c[0] <= 6 and c[1] >= 0
                    diag_list.push(this.matrix[c[0]][c[1]])
                    c[0] += 1
                    c[1] -= 1
                to_check.push(diag_list)

            # diagonals from bottom right to top left
            rd_arrs = [[6,3], [6,4], [6,5], [5,5], [4,5], [3,5]]
            for coords in rd_arrs
                c = coords
                diag_list = []
                while c[0] >= 0 and c[1] >= 0
                    diag_list.push(this.matrix[c[0]][c[1]])
                    c[0] -= 1
                    c[1] -= 1
                to_check.push(diag_list)

            for item in to_check
                item_str = item.join('')
                if /1{4,}/.test(item_str)
                    winner = 'Red'
                    break
                else if /2{4,}/.test(item_str)
                    winner = 'Black'
                    break

        if winner
            if pause_audio()
                document.getElementById('a_win').play()
                if confirm ''+winner+' wins! Play again?'
                    setTimeout(this.new_game(), 1000)
                else
                    if pause_audio()
                        document.getElementById('a_quit').play()
                        this.new_game()


    new_game: ->
        socket.send 'play'
        
        this.matrix = this.new_matrix()
        this.turns = 0
        $('#cols li').html('')
        $('#pregame').hide()
        $('#playing').show()
        playing = true

        this.new_turn()


ball =
    col: 3
    w: 45

    move: (cols) ->
        total = this.col + cols
        if total > 6
            total = 6
        else if total < 0
            total = 0

        this.col = total
        board.highlight_col(this.col*ball.w)

    drop: (y=0) ->
        color = ''
        color = ' black' if board.turn is 2
        b_id = 'b'+board.turns

        $('#c'+this.col)
        .append('<div id="'+b_id+'" class="ball'+color+'"></div>')

        $('#b'+board.turns).css(
            'left': this.col*ball.w+6
            '-webkit-transform': 'translate3d(0px, '+y+'px, 0px)')

        board.new_turn()


log_acceleration = (m) ->
    if waiting
      a = m.acceleration
      as = [a.x,a.y,a.z]

      if prev
          # get the difference in acceleration values from last measure
          diffs = (as[i]-prev[i] for i in [0..2])
          # find which difference is largest
          max_diff = Math.max.apply null, diffs
          # isolate the current a (x, y, or z) value of greatest change
          a_changed = Math.abs parseInt as[diffs.indexOf(max_diff)]

          alert 'BUMP' if max_diff > 4 and a_changed < 2


          $('#bumped').text parseInt max_diff

      # save previous list of acceleration values
      prev = as


# initialize variables
setup = ->
    $('body').bind 'touchmove touchstart', (e) ->
        e.preventDefault()

    # for testing on my computer
    $(window).bind 'keyup', (e) ->
        switch e.keyCode
            when 32 then board.place()
            when 37 then ball.move(-1)
            when 39 then ball.move(1)

    $('#cols').bind 'touchmove touchend', (e) ->
        switch(e.type)
            when 'touchmove'
                e.preventDefault()
                board.highlight_col e.targetTouches[0].pageX
            when 'touchend' then board.place()

    $('#cols li').bind 'touchstart', (e) ->
        e.preventDefault()
        x = $(this).offset().left
        board.highlight_col(x)

    $('#play_friend').bind 'touchend click', (e) ->
        board.new_game()

    $('a').live 'touchstart touchend', (e) -> $(this).toggleClass('highlight')

    for i in [0..5]
        document.getElementById('a'+i).load()

    document.getElementById('a_quit').load()
    document.getElementById('a_win').load()

    hide_address_bar = ->
        window.scrollTo(0, 1)
        true

    hide_address_bar()

    setInterval hide_address_bar, 2000

    window.addEventListener 'devicemotion',
                            log_acceleration,
                            false


$(document).ready setup
