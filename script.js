(function() {
  var ball, board, drop, gyro, i, initial, j, log_acceleration, prev, setup, waiting;
  initial = false;
  prev = false;
  waiting = true;
  gyro = false;
  board = {
    matrix: (function() {
      var _results;
      _results = [];
      for (j = 0; j <= 6; j++) {
        _results.push((function() {
          var _results;
          _results = [];
          for (i = 0; i <= 5; i++) {
            _results.push(null);
          }
          return _results;
        })());
      }
      return _results;
    })(),
    place: function(col) {
      var added, dist, i, _ref;
      added = false;
      dist = $('#box').height();
      this.matrix[col].reverse();
      for (i = 0, _ref = this.matrix[col].length - 1; (0 <= _ref ? i <= _ref : i >= _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        if (!added && !this.matrix[col][i]) {
          this.matrix[col][i] = 1;
          dist -= $('.chip').height() * (i + 1);
          added = true;
        }
      }
      this.matrix[col].reverse();
      if (added) {
        ball.move(0, dist);
        return ball.reset();
      }
    },
    highlight: function() {
      $('#cols li').removeClass('highlight');
      return $('#c' + (ball.col() + 1)).addClass('highlight');
    }
  };
  ball = {
    xtrans: 0,
    ytrans: 0,
    col: function() {
      return parseInt($('.chip').first().offset().left / $('.chip').first().width());
    },
    reset: function() {
      this.xtrans = this.ytrans = 0;
      $('#box').prepend('<div class="chip"></div>');
      return board.highlight();
    },
    proper_x: function(x) {
      var max_xtrans, x_sum;
      max_xtrans = ($('#box').width() - $('.chip').first().width()) / 2;
      x_sum = x;
      if (!gyro) {
        x_sum += this.xtrans;
      }
      if (x_sum < -max_xtrans) {
        return -max_xtrans;
      } else if (x_sum > max_xtrans) {
        return max_xtrans;
      } else {
        return x_sum;
      }
    },
    move: function(x, y) {
      var max_ytrans;
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      this.xtrans = this.proper_x(x);
      max_ytrans = $('#box').height() - $('.chip').first().height();
      this.ytrans = Math.min(y + this.ytrans, max_ytrans);
      $('.chip').first().css('-webkit-transform', 'translate(' + this.xtrans + 'px, ' + this.ytrans + 'px)');
      return board.highlight();
    }
  };
  'log_orientation = (o) ->\n    # indicate the gyroscope is in use\n    gyro = true\n    \n    x = parseInt o.alpha\n    # set the original alpha position of player in space\n    initial = x if not initial\n    # amount to x-translate the chip from middle of board\n    trans = 5*(initial-x)\n    \n    $(\'#initial\').text initial\n    \n    ball.move(trans)';
  log_acceleration = function(m) {
    var a, a_changed, as, diffs, i, max_diff;
    a = m.acceleration;
    as = [a.x, a.y, a.z];
    if (prev) {
      diffs = (function() {
        var _results;
        _results = [];
        for (i = 0; i <= 2; i++) {
          _results.push(as[i] - prev[i]);
        }
        return _results;
      })();
      max_diff = Math.max.apply(null, diffs);
      a_changed = Math.abs(parseInt(as[diffs.indexOf(max_diff)]));
      if (max_diff > 4 && a_changed < 2) {
        alert('BUMP');
      }
      $('#bumped').text(parseInt(max_diff));
    }
    return prev = as;
  };
  drop = function() {
    board.place(ball.col());
    console.log(board.matrix);
    return false;
  };
  setup = function() {
    $('#box').doubleTap(drop);
    $(window).bind('keyup', function(e) {
      switch (e.keyCode) {
        case 32:
          return drop();
        case 37:
          return ball.move(-44);
        case 39:
          return ball.move(44);
      }
    });
    $('.chip').bind('touchmove', function(e) {
      var curX;
      e.preventDefault();
      curX = e.targetTouches[0].pageX - startX;
      $('#pos').text(currX);
      return e.targetTouches[0].target.style.webkitTransform = 'translate(' + curX + 'px)';
    });
    $('#cols').swipeLeft(function() {
      ball.move(-44);
      return false;
    });
    $('#cols').swipeRight(function() {
      ball.move(44);
      return false;
    });
    ball.move();
    if (waiting) {
      return window.addEventListener('devicemotion', log_acceleration, false);
    }
  };
  $(document).ready(setup);
}).call(this);
