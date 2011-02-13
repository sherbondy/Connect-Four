initial = false     # initial orientation value
prev_a = false      # previous acceleration value
waiting = true      # waiting for a bump
gyro = false        # whether or not gyroscope is enabled
turn = 0            # whose turn it is
chip_w = 0          # chip width, set in document ready

board =
    # create a 7x6 matrix
    matrix: ((null for i in [0..5]) for j in [0..6])
    place: (col) -> 
        added = false
        dist = $('#box').height()
        this.matrix[col].reverse()
        for i in [0.. this.matrix[col].length - 1]
            if not added and this.matrix[col][i] is null
                num = 0
                if $('#chip').hasClass('blue')
                    num = 1
                this.matrix[col][i] = num
                dist -= chip_w*(i+1) 
                added = true
        
        this.matrix[col].reverse()
        # only create a new ball if there was actually space to add
        if added
            x_offset = col*chip_w - $('#chip').offset().left + 6
            ball.xtrans += x_offset
            console.log x_offset
            ball.drop(dist)
            ball.reset()
            this.new_turn()
    highlight: -> 
        $('#cols li').removeClass('highlight')
        $('#c'+(ball.col()+1)).addClass('highlight')
    new_turn: ->
        turn = Math.abs(turn-1)
        $('#chip').addClass('blue') if turn is 1
        $('#chip').addClass('red') if turn is 0

ball =
    xtrans: 0
    col: -> parseInt $('#chip').offset().left / chip_w
    reset: -> 
        $('#chip').removeClass 'first'
        board.highlight()
    
    proper_x: (x) ->
        max_xtrans = $('#box').width() - chip_w/2

        x_sum  = x
        # not using gyroscope, want to sum translations
        if not gyro
            x_sum += this.xtrans

        if x_sum < -max_xtrans
            -max_xtrans
        else if x_sum > max_xtrans
            max_xtrans
        else
            x_sum
            
    move: (x=0) ->
        this.xtrans = this.proper_x(x)
        $('#chip').css(
            '-webkit-transform', 'translateX('+this.xtrans+'px)')
        
        board.highlight()
    
    drop: (y=0) ->
        $('#box').append('<div class="chip"></div>')
                        
        $('.chip').last().css(
            '-webkit-transform', 'translate('+this.xtrans+'px, '+y+'px)')
        
        
'''
log_orientation = (o) ->
    # indicate the gyroscope is in use
    gyro = true
    
    x = parseInt o.alpha
    # set the original alpha position of player in space
    initial = x if not initial
    # amount to x-translate the chip from middle of board
    trans = 5*(initial-x)
    
    $('#initial').text initial
    
    ball.move(trans)
'''
    
log_acceleration = (m) ->
    a = m.acceleration
    as = [a.x,a.y,a.z]
    
    if prev
        # get the difference in acceleration values from last measurement
        diffs = (as[i]-prev[i] for i in [0..2])
        # find which difference is largest
        max_diff = Math.max.apply null, diffs
        # isolate the current a (x, y, or z) value of greatest change
        a_changed = Math.abs parseInt as[diffs.indexOf(max_diff)]
        
        alert 'BUMP' if max_diff > 4 and a_changed < 2

        
        $('#bumped').text parseInt max_diff
            
    # save previous list of acceleration values
    prev = as

drop = ->
    board.place(ball.col())
    console.log(board.matrix)
    false
    
setup = ->
    chip_w = $('#chip').width()
    
    $('#box').doubleTap drop
    $(window).bind 'keyup', (e) ->
        switch e.keyCode
            when 32 then drop()
            when 37
                ball.move(-44)
            when 39
                ball.move(44)
    $('body').bind 'touchmove', (e) ->
        e.preventDefault()
        curr_x = e.targetTouches[0].pageX - $('#chip').offset().left - chip_w/2
        ball.move(curr_x)
    
    $('body').bind 'touchmove touchstart', (e) ->
        e.preventDefault()
    
    board.new_turn()
    ball.move()

    # window.addEventListener 'deviceorientation', log_orientation, false;
    
    if waiting
        window.addEventListener 'devicemotion', log_acceleration, false;
        
$(document).ready(setup)