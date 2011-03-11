var ball, board, bump_menu, log_acceleration, no_show, opponent_quit, pause_audio, prevs, setup, socket, test_bump;
prevs = [];
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
Array.prototype.max = function() {
  return Math.max.apply(Math, this);
};
Array.prototype.min = function() {
  return Math.min.apply(Math, this);
};
Array.prototype.sum = function() {
  var num, sum, _i, _len;
  sum = 0;
  for (_i = 0, _len = this.length; _i < _len; _i++) {
    num = this[_i];
    sum += num;
  }
  return sum;
};
Array.prototype.remove = function(e) {
  var t, _ref;
  if ((t = this.indexOf(e)) > -1) {
    return ([].splice.apply(this, [t, t - t + 1].concat(_ref = [])), _ref);
  }
};
String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, '');
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
bump_menu = function(div) {
  var diffs;
  diffs = [];
  $('#bump>div').removeClass('visible');
  if (div) {
    if (!$('#bump').hasClass('visible')) {
      $('#bump').addClass('visible');
      $('#overlay').addClass('visible');
    }
    return $(div).addClass('visible');
  } else {
    $('#bump').removeClass('visible');
    return $('#overlay').removeClass('visible');
  }
};
opponent_quit = function() {
  bump_menu('#opponent_quit');
  return board.quit(true);
};
no_show = function() {
  var connect_timeout;
  if (!sessionStorage.game) {
    bump_menu('#no_match');
    return connect_timeout = window.setTimeout("bump_menu('#connect')", 2000);
  }
};
socket = new io.Socket(null, {
  port: 3000
});
socket.on('connect', function() {
  return socket.send('hey buddy!');
});
socket.on('message', function(obj) {
  console.log(obj);
  if (obj.no_match) {
    return no_show();
  } else if (obj.drop && !board.my_turn()) {
    ball.col = parseInt(obj.drop);
    return board.place();
  } else if (obj.action) {
    if (obj.action === 'quit') {
      return opponent_quit();
    }
  } else if (obj.game) {
    bump_menu();
    sessionStorage.game = obj.game;
    if (obj.opponent) {
      sessionStorage.opponent = obj.opponent;
    } else {
      sessionStorage.opponent = 'Your Opponent';
    }
    if (obj.player) {
      sessionStorage.player = obj.player;
    }
    return board.new_game();
  }
});
socket.on('disconnect', function() {
  bump_menu('#disconnected');
  return board.quit();
});
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
  highlight_col: function(x, using_mouse) {
    var x_diff;
    if (using_mouse == null) {
      using_mouse = false;
    }
    if (board.my_turn()) {
      if (using_mouse) {
        x_diff = x;
      } else {
        x_diff = x - $('#cols').offset().left;
      }
      ball.col = parseInt(x_diff / ball.w);
      $('#cols li').removeClass('highlight');
      return $('#c' + ball.col).addClass('highlight');
    }
  },
  my_turn: function() {
    if (sessionStorage.player) {
      return board.turn === parseInt(sessionStorage.player);
    } else {
      return false;
    }
  },
  new_turn: function() {
    var color, player;
    $('#cols li').removeClass('highlight');
    player = this.turn_text[sessionStorage.player];
    this.turn = (this.turns % 2) + 1;
    this.turns += 1;
    color = this.turn_text[this.turn];
    $('#black_arrow, #red_arrow').hide();
    $('#' + color + '_arrow').show();
    $('#black_move, #red_move').removeClass('glow');
    $('#' + color + '_move').addClass('glow');
    $('#black_text, #red_text').text('');
    if (player === color) {
      $('#status_text').text('My turn.');
    } else {
      $('#status_text').text('Waiting for ' + sessionStorage.opponent + '...');
    }
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
      return this.win_dance();
    }
  },
  win_dance: function() {
    var winner_text;
    if (pause_audio()) {
      winner_text = 'Sorry. ' + sessionStorage.opponent + ' won this round!';
      if (this.turn !== parseInt(sessionStorage.player)) {
        winner_text = 'Hooray! You win!';
        document.getElementById('a_win').play();
      }
      if (confirm(winner_text + ' Play again?')) {
        return this.new_game();
      } else {
        document.getElementById('a_quit').play();
        socket.send({
          action: 'quit',
          game: sessionStorage.game
        });
        return board.quit(true);
      }
    }
  },
  reset: function() {
    this.matrix = this.new_matrix();
    this.turns = 0;
    return $('#cols li').html('');
  },
  quit: function(on_purpose) {
    var quit_timeout;
    if (on_purpose == null) {
      on_purpose = false;
    }
    $('#pregame').show();
    $('#playing').hide();
    $('#end_game').hide();
    sessionStorage.clear();
    this.reset();
    return quit_timeout = window.setTimeout('bump_menu()', 2000);
  },
  new_game: function() {
    this.reset();
    $('#pregame').hide();
    $('#playing').show();
    $('#end_game').show();
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
    if (board.my_turn()) {
      socket.send({
        drop: [ball.col],
        game: sessionStorage.game
      });
    }
    return board.new_turn();
  }
};
log_acceleration = function(m) {
  var a, diff, new_prevs, no_show_timeout, time_stamp;
  if ($('#connect').hasClass('visible')) {
    a = m.accelerationIncludingGravity;
    m = parseInt(Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2) + Math.pow(a.z, 2)));
    new_prevs = prevs.slice(0);
    new_prevs.remove(new_prevs.indexOf(new_prevs.min()));
    diff = Math.abs((new_prevs.sum() / new_prevs.length) - prevs.min());
    if (parseInt(diff) >= 2) {
      prevs = [];
      time_stamp = Math.round(new Date().getTime() / 1000);
      bump_menu('#connecting');
      socket.send({
        action: 'play',
        name: localStorage.my_name,
        time_stamp: time_stamp
      });
      no_show_timeout = window.setTimeout('no_show()', 5000);
    }
    if (prevs.length > 5) {
      prevs.shift();
    }
    return prevs.push(m);
  }
};
test_bump = function() {
  var no_show_timeout, time_stamp;
  socket.connect();
  time_stamp = Math.round(new Date().getTime() / 1000);
  bump_menu('#connecting');
  socket.send({
    action: 'play',
    name: localStorage.my_name,
    time_stamp: time_stamp
  });
  return no_show_timeout = window.setTimeout('no_show()', 5000);
};
setup = function() {
  var hide_address_bar, i, name_submit, set_my_name;
  $('body').bind('touchmove touchstart', function(e) {
    return e.preventDefault();
  });
  $(window).bind('keyup', function(e) {
    if (board.my_turn()) {
      switch (e.keyCode) {
        case 32:
          return board.place();
        case 37:
          return ball.move(-1);
        case 39:
          return ball.move(1);
      }
    }
  });
  $('#cols').bind('touchmove touchend', function(e) {
    if (board.my_turn()) {
      switch (e.type) {
        case 'touchmove':
          e.preventDefault();
          return board.highlight_col(e.targetTouches[0].pageX);
        case 'touchend':
          return board.place();
      }
    }
  });
  $('#cols li').bind('touchstart mouseover click', function(e) {
    var x;
    if (board.my_turn()) {
      switch (e.type) {
        case 'touchstart':
          e.preventDefault();
          x = $(this).offset().left;
          return board.highlight_col(x);
        case 'mouseover':
          x = $(this).attr('id').split('c')[1] * ball.w;
          return board.highlight_col(x, true);
        case 'click':
          return board.place();
      }
    }
  });
  $('#play_friend').bind('touchend click', function(e) {
    socket.connect();
    return bump_menu('#connect');
  });
  $('#close').bind('touchend click', function(e) {
    return bump_menu();
  });
  $('#name_button').bind('touchend click', function(e) {
    bump_menu('#edit_name');
    if (localStorage.my_name) {
      $('#your_name').attr('value', localStorage.my_name);
    }
    return document.getElementById('your_name').focus();
  });
  $('#end_game').bind('touchend click', function(e) {
    return socket.disconnect(true);
  });
  set_my_name = function(e) {
    if (localStorage.my_name) {
      return $('#my_name').text(localStorage.my_name);
    }
  };
  set_my_name();
  name_submit = function(e) {
    var new_name;
    e.preventDefault();
    new_name = $('#your_name').attr('value').trim();
    if (new_name) {
      localStorage.my_name = new_name;
      set_my_name();
    }
    bump_menu('#connect');
    return document.getElementById('your_name').blur();
  };
  $('#new_name').bind('submit', name_submit);
  $('a').live('touchstart touchend click', function(e) {
    e.preventDefault();
    if (e.type !== 'click') {
      return $(this).toggleClass('highlight');
    }
  });
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
  return window.addEventListener('devicemotion', log_acceleration, false);
};
$(document).ready(setup);