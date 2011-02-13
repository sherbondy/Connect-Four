(function() {
  var ball, board, chip_w, drop, gyro, i, initial, j, log_acceleration, prev_a, setup, turn, waiting;
  initial = false;
  prev_a = false;
  waiting = true;
  gyro = false;
  turn = 0;
  chip_w = 0;
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
      var added, dist, i, num, x_offset, _ref;
      added = false;
      dist = $('#box').height();
      this.matrix[col].reverse();
      for (i = 0, _ref = this.matrix[col].length - 1; (0 <= _ref ? i <= _ref : i >= _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        if (!added && this.matrix[col][i] === null) {
          num = 0;
          if ($('#chip').hasClass('blue')) {
            num = 1;
          }
          this.matrix[col][i] = num;
          dist -= chip_w * (i + 1);
          added = true;
        }
      }
      this.matrix[col].reverse();
      if (added) {
        x_offset = col * chip_w - $('#chip').offset().left + 6;
        ball.xtrans += x_offset;
        console.log(x_offset);
        ball.drop(dist);
        ball.reset();
        return this.new_turn();
      }
    },
    highlight: function() {
      $('#cols li').removeClass('highlight');
      return $('#c' + (ball.col() + 1)).addClass('highlight');
    },
    new_turn: function() {
      turn = Math.abs(turn - 1);
      if (turn === 1) {
        $('#chip').addClass('blue');
      }
      if (turn === 0) {
        return $('#chip').addClass('red');
      }
    }
  };
  ball = {
    xtrans: 0,
    col: function() {
      return parseInt($('#chip').offset().left / chip_w);
    },
    reset: function() {
      $('#chip').removeClass('first');
      return board.highlight();
    },
    proper_x: function(x) {
      var max_xtrans, x_sum;
      max_xtrans = $('#box').width() - chip_w / 2;
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
    move: function(x) {
      if (x == null) {
        x = 0;
      }
      this.xtrans = this.proper_x(x);
      $('#chip').css('-webkit-transform', 'translateX(' + this.xtrans + 'px)');
      return board.highlight();
    },
    drop: function(y) {
      if (y == null) {
        y = 0;
      }
      $('#box').append('<div class="chip"></div>');
      return $('.chip').last().css('-webkit-transform', 'translate(' + this.xtrans + 'px, ' + y + 'px)');
    }
  };
  'log_orientation = (o) ->\n    # indicate the gyroscope is in use\n    gyro = true\n    \n    x = parseInt o.alpha\n    # set the original alpha position of player in space\n    initial = x if not initial\n    # amount to x-translate the chip from middle of board\n    trans = 5*(initial-x)\n    \n    $(\'#initial\').text initial\n    \n    ball.move(trans)';
  log_acceleration = function(m) {
    var a, a_changed, as, diffs, i, max_diff, prev;
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
    chip_w = $('#chip').width();
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
    $('body').bind('touchmove', function(e) {
      var curr_x;
      e.preventDefault();
      curr_x = e.targetTouches[0].pageX - $('#chip').offset().left - chip_w / 2;
      return ball.move(curr_x);
    });
    $('body').bind('touchmove touchstart', function(e) {
      return e.preventDefault();
    });
    board.new_turn();
    ball.move();
    if (waiting) {
      return window.addEventListener('devicemotion', log_acceleration, false);
    }
  };
  $(document).ready(setup);
}).call(this);
