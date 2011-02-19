(function() {
  var ball, board, log_acceleration, pause_audio, prev, prev_a, setup, waiting;
  prev_a = false;
  waiting = true;
  prev = 0;
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
  pause_audio = function() {
    var item, _i, _len, _ref, _results;
    _ref = document.getElementsByTagName('audio');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      item.pause();
      _results.push(true);
    }
    return _results;
  };
  board = {
    h: 325,
    matrix: [],
    turn: 0,
    turn_text: [null, 'red', 'black'],
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
      var added, col, dist, i, row, _ref;
      row = 0;
      col = ball.col;
      added = false;
      dist = this.h;
      this.matrix[col].reverse();
      for (i = 0, _ref = this.matrix[col].length - 1; (0 <= _ref ? i <= _ref : i >= _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        if (!added && this.matrix[col][i] === 0) {
          this.matrix[col][i] = this.turn;
          dist -= ball.w * (i + 1) + (this.matrix[col].real_len() - 5);
          added = true;
          row = i;
          break;
        }
      }
      this.matrix[col].reverse();
      if (added) {
        if (pause_audio()) {
          document.getElementById('a' + row).play();
        }
        return ball.drop(dist);
      }
    },
    highlight_col: function(x) {
      ball.col = parseInt(x / ball.w);
      $('#cols li').removeClass('highlight');
      return $('#c' + ball.col).addClass('highlight');
    },
    new_turn: function() {
      var color;
      $('#cols li').removeClass('highlight');
      this.turn = (this.turns % 2) + 1;
      this.turns += 1;
      color = this.turn_text[this.turn];
      $('#black_arrow, #red_arrow').hide();
      $('#' + color + '_arrow').show();
      $('#black_move, #red_move').removeClass('glow');
      $('#' + color + '_move').addClass('glow');
      $('#black_text, #red_text').text('');
      $('#' + color + '_text').text(color + ' player\'s turn.');
      return this.check_win();
    },
    check_win: function() {
      var c, coords, diag_list, i, item, item_str, j, ld_arrs, rd_arrs, row, to_check, winner, _i, _j, _k, _len, _len2, _len3;
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
        ld_arrs = [[0, 3], [0, 4], [0, 5], [1, 5], [2, 5], [3, 5]];
        for (_i = 0, _len = ld_arrs.length; _i < _len; _i++) {
          coords = ld_arrs[_i];
          c = coords;
          diag_list = [];
          while (c[0] <= 6 && c[1] >= 0) {
            diag_list.push(this.matrix[c[0]][c[1]]);
            c[0] += 1;
            c[1] -= 1;
          }
          to_check.push(diag_list);
        }
        rd_arrs = [[6, 3], [6, 4], [6, 5], [5, 5], [4, 5], [3, 5]];
        for (_j = 0, _len2 = rd_arrs.length; _j < _len2; _j++) {
          coords = rd_arrs[_j];
          c = coords;
          diag_list = [];
          while (c[0] >= 0 && c[1] >= 0) {
            diag_list.push(this.matrix[c[0]][c[1]]);
            c[0] -= 1;
            c[1] -= 1;
          }
          to_check.push(diag_list);
        }
        for (_k = 0, _len3 = to_check.length; _k < _len3; _k++) {
          item = to_check[_k];
          item_str = item.join('');
          if (/1{4,}/.test(item_str)) {
            winner = 'Red';
            break;
          } else if (/2{4,}/.test(item_str)) {
            winner = 'Black';
            break;
          }
        }
      }
      if (winner) {
        if (pause_audio()) {
          document.getElementById('a_win').play();
          if (confirm('' + winner + ' wins! Play again?')) {
            return setTimeout(this.new_game(), 1000);
          } else {
            if (pause_audio()) {
              document.getElementById('a_quit').play();
              return this.new_game();
            }
          }
        }
      }
    },
    new_game: function() {
      this.matrix = this.new_matrix();
      this.turns = 0;
      $('#cols li').html('');
      return this.new_turn();
    }
  };
  ball = {
    col: 3,
    w: 45,
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
      var b_id, color;
      if (y == null) {
        y = 0;
      }
      color = '';
      if (board.turn === 2) {
        color = ' black';
      }
      b_id = 'b' + board.turns;
      $('#c' + this.col).append('<div id="' + b_id + '" class="ball' + color + '"></div>');
      $('#b' + board.turns).css({
        'left': this.col * ball.w + 6,
        '-webkit-transform': 'translate3d(0px, ' + y + 'px, 0px)'
      });
      return board.new_turn();
    }
  };
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
  setup = function() {
    var hide_address_bar, i;
    $('body').bind('touchmove touchstart', function(e) {
      return e.preventDefault();
    });
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
      switch (e.type) {
        case 'touchmove':
          e.preventDefault();
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
    board.new_game();
    for (i = 0; i <= 5; i++) {
      document.getElementById('a' + i).load();
    }
    document.getElementById('a_quit').load();
    document.getElementById('a_win').load();
    hide_address_bar = function() {
      window.scrollTo(0, 1);
      return true;
    };
    hide_address_bar();
    setInterval(hide_address_bar, 2000);
    if (waiting) {
      return window.addEventListener('devicemotion', log_acceleration, false);
    }
  };
  $(document).ready(setup);
}).call(this);
