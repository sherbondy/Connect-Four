initial = false     # initial orientation value
prev_a = false      # previous acceleration value
waiting = true      # waiting for a bump
gyro = false        # whether or not gyroscope is enabled
turn = 0            # whose turn it is, either player 1 or 2
ball_w = 0          # ball width, set in document ready
box_h = 0           # height of the bounding box


Array::real_len = ->
    if not this.length
        0
    else
        n = 0
        (n += 1 for i in [0..this.length-1] when this[i] isnt 0)
        n

new_matrix = ->
    ((0 for i in [0..5]) for j in [0..6])
    
board =
    # create a 7x6 matrix
    
    matrix: new_matrix()
    turns: 0
    place: (col) -> 
        added = false
        dist = box_h
        this.matrix[col].reverse()
        for i in [0.. this.matrix[col].length - 1]
            if not added and this.matrix[col][i] is 0
                this.matrix[col][i] = turn
                dist -= ball_w*(i+1) 
                added = true
        
        this.matrix[col].reverse()
        # only create a new ball if there was actually space to add
        if added
            ball.drop(dist)
            
    highlight_col: (x) ->
        ball.col = parseInt (x+ball_w) / ball_w
        $('#cols li').removeClass('highlight')
        $('#c'+ball.col).addClass('highlight')
        
    new_turn: ->
        this.turns += 1
        turn = this.turns % 2 + 1
        console.log turn
        this.check_win()
    
    check_win: ->
        if this.turns is 43
            if confirm 'Game ended in a draw. New game?'
                this.new_game()
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
                console.log(row)
                if row.real_len() > 3
                    to_check.push(row)
                    
            # still need to check diagonals
                    
            console.log to_check
            for item in to_check
                item_str = item.join('')
                return alert 'Red wins!' if /1{4,}/.test(item_str)
                return alert 'Blue wins!' if /2{4,}/.test(item_str)
                
            
    
    new_game: ->
        this.turns = 0
        ball.col = 3
        $('#bag').html('')
        this.matrix = new_matrix()
            

ball =
    col: 3
    
    move: (cols) ->
        total = this.col + cols
        if total > 6
            this.col = 6
        else if total < 0
            this.col = 0
        else:
            this.col = total
    
    drop: (y=0) ->
        color = ''
        color = 'blue' if turn is 2
        $('#bag').append('<div id="b'+board.turns+'" class="ball '+color+'"></div>')
                        
        $('#b'+board.turns).css(
            '-webkit-transform', 'translate('+($(this).offset().left - this.col*ball_w)+'px, '+y+'px)')
        
        board.highlight()
        board.new_turn()
        
        
'''
log_orientation = (o) ->
    # indicate the gyroscope is in use
    gyro = true
    
    x = parseInt o.alpha
    # set the original alpha position of player in space
    initial = x if not initial
    # amount to x-translate the ball from middle of board
    trans = 5*(initial-x)
    
    $('#initial').text initial
    
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

# initialize variables, bind event listeners
setup = ->
    ball_w = 44
    box_h = $('#box').height()
    
    # for testing on my computer
    $(window).bind 'keyup', (e) ->
        switch e.keyCode
            when 32 then board.place(ball.col())
            when 37 then ball.move(-1)
            when 39 then ball.move(1)
                
    $('#cols').bind 'touchstart touchmove touchend', (e) ->
        e.preventDefault()
        touch_x = e.targetTouches[0].pageX
        switch e.type
            when 'touchstart' then board.highlight_col(touch_x)
            when 'touchmove' then board.highlight_col(touch_x)
            when 'touchend' then ball.place()
    
    $('body').bind 'touchmove touchstart', (e) ->
        e.preventDefault()
    
    board.new_turn()
    ball.move()

    # window.addEventListener 'deviceorientation', log_orientation, false;
    
    if waiting
        window.addEventListener 'devicemotion', log_acceleration, false;
        
$(document).ready(setup)