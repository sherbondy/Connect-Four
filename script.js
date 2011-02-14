(function() {
  var ball, ball_w, board, box_h, gyro, initial, log_acceleration, new_matrix, prev_a, setup, turn, waiting;
  initial = false;
  prev_a = false;
  waiting = true;
  gyro = false;
  turn = 0;
  ball_w = 0;
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
  new_matrix = function() {
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
  };
  board = {
    matrix: new_matrix(),
    turns: 0,
    place: function(col) {
      var added, dist, i, _ref;
      added = false;
      dist = box_h;
      this.matrix[col].reverse();
      for (i = 0, _ref = this.matrix[col].length - 1; (0 <= _ref ? i <= _ref : i >= _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        if (!added && this.matrix[col][i] === 0) {
          this.matrix[col][i] = turn;
          dist -= ball_w * (i + 1);
          added = true;
        }
      }
      this.matrix[col].reverse();
      if (added) {
        return ball.drop(dist);
      }
    },
    highlight_col: function(x) {
      ball.col = parseInt((x + ball_w) / ball_w);
      $('#cols li').removeClass('highlight');
      return $('#c' + ball.col).addClass('highlight');
    },
    new_turn: function() {
      this.turns += 1;
      turn = this.turns % 2 + 1;
      console.log(turn);
      return this.check_win();
    },
    check_win: function() {
      var i, item, item_str, j, row, to_check, _i, _len;
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
          console.log(row);
          if (row.real_len() > 3) {
            to_check.push(row);
          }
        }
        console.log(to_check);
        for (_i = 0, _len = to_check.length; _i < _len; _i++) {
          item = to_check[_i];
          item_str = item.join('');
          if (/1{4,}/.test(item_str)) {
            return alert('Red wins!');
          }
          if (/2{4,}/.test(item_str)) {
            return alert('Blue wins!');
          }
        }
      }
    },
    new_game: function() {
      this.turns = 0;
      ball.col = 3;
      $('#bag').html('');
      return this.matrix = new_matrix();
    }
  };
  ball = {
    col: 3,
    move: function(cols) {
      var total;
      total = this.col + cols;
      if (total > 6) {
        this.col = 6;
      } else if (total < 0) {
        this.col = 0;
      }
      return {
        "else": this.col = total
      };
    },
    drop: function(y) {
      var color;
      if (y == null) {
        y = 0;
      }
      color = '';
      if (turn === 2) {
        color = 'blue';
      }
      $('#bag').append('<div id="b' + board.turns + '" class="ball ' + color + '"></div>');
      $('#b' + board.turns).css('-webkit-transform', 'translate(' + ($(this).offset().left - this.col * ball_w) + 'px, ' + y + 'px)');
      board.highlight();
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
    ball_w = 44;
    box_h = $('#box').height();
    $(window).bind('keyup', function(e) {
      switch (e.keyCode) {
        case 32:
          return board.place(ball.col());
        case 37:
          return ball.move(-1);
        case 39:
          return ball.move(1);
      }
    });
    $('#cols').bind('touchstart touchmove touchend', function(e) {
      var touch_x;
      e.preventDefault();
      touch_x = e.targetTouches[0].pageX;
      switch (e.type) {
        case 'touchstart':
          return board.highlight_col(touch_x);
        case 'touchmove':
          return board.highlight_col(touch_x);
        case 'touchend':
          return ball.place();
      }
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
