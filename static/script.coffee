# previous acceleration values
prevs = []
jerks = []

Array::real_len = ->
    if not this.length
        0
    else
        n = 0
        (n += 1 for i in [0..this.length-1] when this[i] isnt 0)
        n

Array::max = ->
    Math.max.apply(Math, this)

Array::min = ->
    Math.min.apply(Math, this)

Array::sum = ->
    sum = 0
    sum += num for num in this
    return sum
Array::remove = (e) ->
    @[t..t] = [] if (t = @.indexOf(e)) > -1

String::trim = ->
    this.replace(/^\s+|\s+$/g,'')

pause_audio = ->
    for item in document.getElementsByTagName('audio')
        item.pause()
        true

bump_menu = (div) ->
    $('#bump>div').hide()
    if div
        $('#bump').show()
        $('#overlay').show()
        $(div).show()
    else
        $('#bump').hide()
        $('#overlay').hide()

opponent_quit = ->
    bump_menu('#opponent_quit')
    board.quit()

no_show = ->
    if not sessionStorage.game and $('#connecting').hasClass 'visible'
      bump_menu '#no_match'
      connect_timeout = window.setTimeout "bump_menu('#connect')", 2000


# Socket IO

socket = new io.Socket null, {port:3000}

socket.on 'connect', ->
    socket.send 'hey buddy!'
socket.on 'message', (obj)->
    console.log obj
    if obj.no_match
        no_show()
    else if obj.drop and not board.my_turn()
        ball.col = parseInt(obj.drop)
        board.place()
    else if obj.action
        if obj.action is 'quit'
            opponent_quit()
    else if obj.game
        bump_menu()

        sessionStorage.game = obj.game
        if obj.opponent
            sessionStorage.opponent = obj.opponent
        else
            sessionStorage.opponent = 'Your Opponent'
        if obj.player
            sessionStorage.player = obj.player
        board.new_game()
socket.on 'disconnect', ->
    bump_menu '#disconnected'
    board.quit()

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

    highlight_col: (x, using_mouse=false) ->
        if board.my_turn()
            if using_mouse
                x_diff = x
            else
                x_diff = x - $('#cols').offset().left
            ball.col = parseInt(x_diff/ball.w)

            $('#cols li').removeClass('highlight')
            $('#c'+ball.col).addClass('highlight')

    my_turn: ->
        if sessionStorage.player
            board.turn is parseInt(sessionStorage.player)
        else
            false

    new_turn: ->
        $('#cols li').removeClass('highlight')
        player = this.turn_text[sessionStorage.player]

        this.turn = (this.turns % 2) + 1
        this.turns += 1

        color = this.turn_text[this.turn]

        $('#black_arrow, #red_arrow').hide()
        $('#'+color+'_arrow').show()

        $('#black_move, #red_move').removeClass('glow')
        $('#'+color+'_move').addClass('glow')
        $('#black_text, #red_text').text('')

        if player is color
            $('#status_text').text('My turn.')
        else
            $('#status_text').text('Waiting for '+sessionStorage.opponent+'...')
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
            this.win_dance()

    win_dance: ->
        if pause_audio()
            winner_text = 'Sorry. '+sessionStorage.opponent+' won this round!'
            if this.turn isnt parseInt(sessionStorage.player)
                winner_text = 'Hooray! You win!'
                document.getElementById('a_win').play()
            if confirm winner_text+' Play again?'
                # if the opponent object is no longer set, they quit
                # but the confirm blocked the quit funciton
                if sessionStorage.opponent
                    this.new_game()
                else
                    opponent_quit()
            else
                document.getElementById('a_quit').play()
                socket.send {action:'quit', game:sessionStorage.game}
                board.quit()

    reset: ->
        this.matrix = this.new_matrix()
        this.turns = 0
        $('#cols li').html('')

    quit: ->
        $('#pregame').show()
        $('#playing').hide()
        $('#end_game').hide()
        sessionStorage.clear()
        this.reset()
        quit_timeout = window.setTimeout 'bump_menu()', 2000

    new_game: ->
        this.reset()
        $('#pregame').hide()
        $('#playing').show()
        $('#end_game').show()

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

        if board.my_turn()
            # we wrap the col in an array to prevent 0 from evaluating as false
            socket.send {drop:[ball.col], game:sessionStorage.game}
        board.new_turn()


log_acceleration = (m) ->
    if $('#connect').hasClass 'visible'
        a = m.accelerationIncludingGravity
        m = parseInt(Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2) + Math.pow(a.z, 2)))

        if prevs
            jerks.push(m-prevs[prevs.length-1])
        if jerks.length > 10
            jerks.shift()

        max = jerks.max()
        sum = jerks.sum()

        if max >= 2 and Math.abs(sum) < 2
            prevs = []
            jerks = []


            bump_menu '#connecting'
            socket.send {action:'play', name:localStorage.my_name, location:geo.location}

            # if no match is found within 5 seconds.
            no_show_timeout = window.setTimeout 'no_show()', 5000


        # save previous list of acceleration values
        if prevs.length > 10
            prevs.shift()

        prevs.push(m)


test_bump = ->
    socket.connect()

    bump_menu '#connecting'
    socket.send {action:'play', name:localStorage.my_name, location:geo.location}
    no_show_timeout = window.setTimeout 'no_show()', 5000

geo =
    location: {latitude: null, longitude: null}
    success: (position) ->
        console.log position
        geo.location.latitude = Math.round(position.coords.latitude)
        geo.location.longitude = Math.round(position.coords.longitude)
    error: (e) ->
        console.log 'Error obtaining geolocation: '+e



# initialize variables
setup = ->
    $('body').bind 'touchmove touchstart', (e) ->
        e.preventDefault()

    # for testing on my computer
    $(window).bind 'keyup', (e) ->
        if board.my_turn()
            switch e.keyCode
                when 32
                    board.place()
                when 37 then ball.move(-1)
                when 39 then ball.move(1)

    $('#cols').bind 'touchmove touchend', (e) ->
        if board.my_turn()
            switch e.type
                when 'touchmove'
                    e.preventDefault()
                    board.highlight_col e.targetTouches[0].pageX
                when 'touchend'
                    board.place()

    $('#cols li').bind 'touchstart mouseover click', (e) ->
        if board.my_turn()
          switch e.type
              when 'touchstart'
                  e.preventDefault()
                  x = $(this).offset().left
                  board.highlight_col(x)
              when 'mouseover'
                  x = $(this).attr('id').split('c')[1]*ball.w
                  board.highlight_col(x, true)
              when 'click'
                  board.place()

    $('#play_friend').bind 'touchend click', (e) ->
        socket.connect()
        bump_menu('#connect')

    $('#close').bind 'touchend click', (e) ->
        bump_menu()

    $('#name_button').bind 'touchend click', (e) ->
        bump_menu('#edit_name')
        if localStorage.my_name
            $('#your_name').attr 'value', localStorage.my_name
        # autofocus is broken in mobile safari :(
        document.getElementById('your_name').focus()

    $('#end_game').bind 'touchend click', (e) ->
        socket.disconnect()

    set_my_name = (e) ->
        if localStorage.my_name
            $('#my_name').text localStorage.my_name

    set_my_name()

    name_submit = (e) ->
        e.preventDefault()
        new_name = $('#your_name').attr('value').trim()
        if new_name
            localStorage.my_name = new_name
            set_my_name()
        bump_menu('#connect')
        document.getElementById('your_name').blur()

    $('#new_name').bind 'submit', name_submit


    $('a').live 'touchstart touchend click', (e) ->
        e.preventDefault()
        if e.type isnt 'click'
            $(this).toggleClass('highlight')

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

    navigator.geolocation.getCurrentPosition(geo.success,
                                             geo.error,
                                             {maximumAge:600000})


$(document).ready setup
