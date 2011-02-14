(function() {
  var ball, board, box_h, gyro, initial, log_acceleration, prev_a, setup, waiting;
  initial = false;
  prev_a = false;
  waiting = true;
  gyro = false;
  box_h = 0;
  Array.prototype.real_len = function() {
    var i, n, _ref;
    if (!this.length) {
      return 0;
    } else {
      n = 0;
      for (i = 0, _ref = this.length - 1; (0 <= _ref ? i <= _ref : i >= _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        if (this[i] !== 0) {
          n += 1;
        }
      }
      return n;
    }
  };
  board = {
    matrix: [],
    turn: 0,
    turns: 0,
    new_matrix: function() {
      var i, j, _results;
      _results = [];
      for (j = 0; j <= 6; j++) {
        _results.push((function() {
          var _results;
          _results = [];
          for (i = 0; i <= 5; i++) {
            _results.push(0);
          }
          return _results;
        })());
      }
      return _results;
    },
    place: function() {
      var added, col, dist, i, _ref;
      col = ball.col;
      added = false;
      dist = box_h;
      this.matrix[col].reverse();
      for (i = 0, _ref = this.matrix[col].length - 1; (0 <= _ref ? i <= _ref : i >= _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        if (!added && this.matrix[col][i] === 0) {
          this.matrix[col][i] = this.turn;
          dist -= ball.w * (i + 1);
          added = true;
        }
      }
      this.matrix[col].reverse();
      if (added) {
        return ball.drop(dist);
      }
    },
    highlight_col: function(x) {
      ball.col = parseInt(x / ball.w);
      $('#cols li').removeClass('highlight');
      return $('#c' + ball.col).addClass('highlight');
    },
    new_turn: function() {
      this.turn = (this.turns % 2) + 1;
      this.turns += 1;
      return this.check_win();
    },
    check_win: function() {
      var i, item, item_str, j, row, to_check, winner, _i, _len;
      winner = false;
      if (this.turns === 43) {
        if (confirm('Game ended in a draw. New game?')) {
          this.new_game();
        }
      }
      if (this.turns > 7) {
        to_check = [];
        for (j = 0; j <= 6; j++) {
          if (this.matrix[j].real_len() > 3) {
            to_check.push(this.matrix[j]);
          }
        }
        for (i = 0; i <= 5; i++) {
          row = (function() {
            var _results;
            _results = [];
            for (j = 0; j <= 6; j++) {
              _results.push(this.matrix[j][i]);
            }
            return _results;
          }).call(this);
          if (row.real_len() > 3) {
            to_check.push(row);
          }
        }
        for (_i = 0, _len = to_check.length; _i < _len; _i++) {
          item = to_check[_i];
          item_str = item.join('');
          if (/1{4,}/.test(item_str)) {
            winner = 'Red';
            break;
          } else if (/2{4,}/.test(item_str)) {
            winner = 'Blue';
            break;
          }
        }
      }
      if (winner) {
        if (confirm('' + winner + ' wins! Play again?')) {
          return this.new_game();
        } else {
          return this.clear();
        }
      }
    },
    clear: function() {
      return this.matrix = this.new_matrix();
    },
    new_game: function() {
      board.clear();
      ball.col = 3;
      $('#cols li').html('');
      return this.new_turn();
    }
  };
  ball = {
    col: 3,
    w: 44,
    move: function(cols) {
      var total;
      total = this.col + cols;
      if (total > 6) {
        total = 6;
      } else if (total < 0) {
        total = 0;
      }
      this.col = total;
      return board.highlight_col(this.col * ball.w);
    },
    drop: function(y) {
      var b_id, color, x;
      if (y == null) {
        y = 0;
      }
      color = '';
      if (board.turn === 2) {
        color = ' blue';
      }
      b_id = 'b' + board.turns;
      $('#c' + this.col).append('<div id="' + b_id + '" class="ball' + color + '"></div>');
      x = this.col * ball.w - $('#' + b_id).offset().left + 6;
      $('#b' + board.turns).css('-webkit-transform', 'translate(' + x + 'px, ' + y + 'px)');
      return board.new_turn();
    }
  };
  'log_orientation = (o) ->\n    # indicate the gyroscope is in use\n    gyro = true\n    \n    x = parseInt o.alpha\n    # set the original alpha position of player in space\n    initial = x if not initial\n    # amount to x-translate the ball from middle of board\n    trans = 5*(initial-x)\n    \n    $(\'#initial\').text initial\n    ';
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
  setup = function() {
    box_h = $('#box').height();
    $(window).bind('keyup', function(e) {
      switch (e.keyCode) {
        case 32:
          return board.place();
        case 37:
          return ball.move(-1);
        case 39:
          return ball.move(1);
      }
    });
    $('#cols').bind('touchmove touchend', function(e) {
      e.preventDefault();
      switch (e.type) {
        case 'touchmove':
          return board.highlight_col(e.targetTouches[0].pageX);
        case 'touchend':
          return board.place();
      }
    });
    $('#cols li').bind('touchstart', function(e) {
      var x;
      e.preventDefault();
      x = $(this).offset().left;
      return board.highlight_col(x);
    });
    $('body').bind('touchmove touchstart', function(e) {
      return e.preventDefault();
    });
    board.new_game();
    if (waiting) {
      return window.addEventListener('devicemotion', log_acceleration, false);
    }
  };
  $(document).ready(setup);
}).call(this);
