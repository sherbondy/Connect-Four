initial = false     # initial orientation value
prev_a = false      # previous acceleration value
waiting = true      # waiting for a bump
gyro = false        # whether or not gyroscope is enabled
box_h = 0           # height of the bounding box


Array::real_len = ->
    if not this.length
        0
    else
        n = 0
        (n += 1 for i in [0..this.length-1] when this[i] isnt 0)
        n
    
board =
    # create a 7x6 matrix
    
    matrix: []
    turn: 0 # player turn, either 1 or 2
    turns: 0 # total number of turns in the game
    
    new_matrix: ->
        (0 for i in [0..5] for j in [0..6])
        
    place: -> 
        col = ball.col
        added = false
        dist = box_h
        this.matrix[col].reverse()
        for i in [0.. this.matrix[col].length - 1]
            if not added and this.matrix[col][i] is 0
                this.matrix[col][i] = this.turn
                dist -= ball.w*(i+1) 
                added = true
        
        this.matrix[col].reverse()
        # only create a new ball if there was actually space to add
        if added
            ball.drop(dist)
            
    highlight_col: (x) ->
        ball.col = parseInt (x) / ball.w
        
        $('#cols li').removeClass('highlight')
        $('#c'+ball.col).addClass('highlight')
        
    new_turn: ->
        this.turn = (this.turns % 2) + 1
        this.turns += 1
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
                    
            # still need to check diagonals
                    
            for item in to_check
                item_str = item.join('')
                if /1{4,}/.test(item_str)
                    winner = 'Red'
                    break
                else if /2{4,}/.test(item_str)
                    winner = 'Blue'
                    break
            
        if winner
            if confirm ''+winner+' wins! Play again?'
                this.new_game()
            else
                this.clear()
            
    clear: ->
        this.matrix = this.new_matrix()

    new_game: ->
        board.clear()
        ball.col = 3
        $('#cols li').html('')
        
        this.new_turn()
            

ball =
    col: 3
    w: 44
    
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
        color = ' blue' if board.turn is 2
        b_id = 'b'+board.turns
                
        $('#c'+this.col).append('<div id="'+b_id+'" class="ball'+color+'"></div>')
        x = this.col*ball.w - $('#'+b_id).offset().left + 6
        
        $('#b'+board.turns).css(
            '-webkit-transform', 'translate('+x+'px, '+y+'px)')
        
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
    box_h = $('#box').height()
    
    # for testing on my computer
    $(window).bind 'keyup', (e) ->
        switch e.keyCode
            when 32 then board.place()
            when 37 then ball.move(-1)
            when 39 then ball.move(1)
                
    $('#cols').bind 'touchmove touchend', (e) ->
        e.preventDefault()
        switch e.type
            when 'touchmove' then board.highlight_col(e.targetTouches[0].pageX)
            when 'touchend' then board.place()
            
    $('#cols li').bind 'touchstart', (e) ->
        e.preventDefault()
        x = $(this).offset().left
        board.highlight_col(x)
    
    $('body').bind 'touchmove touchstart', (e) ->
        e.preventDefault()
    
    board.new_game()

    # window.addEventListener 'deviceorientation', log_orientation, false;
    
    if waiting
        window.addEventListener 'devicemotion', log_acceleration, false;
        
$(document).ready(setup)