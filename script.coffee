initial = false
prev = false
waiting = true # waiting for a bump
gyro = false

board =
    # create a 7x6 matrix
    matrix: ((null for i in [0..5]) for j in [0..6])
    place: (col) -> 
        added = false
        dist = $('#box').height()
        this.matrix[col].reverse()
        for i in [0.. this.matrix[col].length - 1]
            if not added and not this.matrix[col][i]
                this.matrix[col][i] = 1
                dist -= $('.chip').height()*(i+1) 
                added = true
        
        this.matrix[col].reverse()
        if added
            ball.move(0, dist)
            ball.reset()
    highlight: -> 
        $('#cols li').removeClass('highlight')
        $('#c'+(ball.col()+1)).addClass('highlight')

ball =
    xtrans: 0
    ytrans: 0
    col: -> parseInt $('.chip').first().offset().left / $('.chip').first().width()
    reset: -> 
        this.xtrans = this.ytrans = 0
        $('#box').prepend('<div class="chip"></div>')
        board.highlight()
    proper_x: (x) ->
        max_xtrans = ($('#box').width() - $('.chip').first().width())/2
        
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
            
    move: (x=0, y=0) ->        
        this.xtrans = this.proper_x(x)
        
        max_ytrans = $('#box').height() - $('.chip').first().height()
        this.ytrans = Math.min(y+this.ytrans, max_ytrans)
                
        $('.chip').first().css(
            '-webkit-transform', 'translate('+this.xtrans+'px, '+this.ytrans+'px)')
        
        board.highlight()
        
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
    $('#box').doubleTap drop
    $(window).bind 'keyup', (e) ->
        switch e.keyCode
            when 32 then drop()
            when 37
                ball.move(-44)
            when 39
                ball.move(44)
    $('.chip').bind 'touchmove', (e) ->
        e.preventDefault();
        curX = e.targetTouches[0].pageX - startX
        $('#pos').text(currX)
        e.targetTouches[0].target.style.webkitTransform = 'translate(' + curX + 'px)'
        
    $('#cols').swipeLeft -> 
        ball.move(-44)
        false
    $('#cols').swipeRight -> 
        ball.move(44)
        false
    
    ball.move()

    # window.addEventListener 'deviceorientation', log_orientation, false;
    
    if waiting
        window.addEventListener 'devicemotion', log_acceleration, false;
        
$(document).ready(setup)