// mapper_ui.js
// Peter Sovietov

(function () {
  var canvas, ctx, conf, map,
    reversed_dirs = [1, 0, 3, 2],
    ui = {
      width: 10,
      height: 4,
      wire_length: 50,
      cycles: 50000
    },
    box_width = 60, box_height = 55,
    gap_width = 35, gap_height = 35,
    arrow_gap = 5;

  function arrow_shape(x, y, width, rad) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rad);
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(1, -1);
    ctx.lineTo(width - 8, -1);
    ctx.lineTo(width - 8, -4);
    ctx.lineTo(width, 0);
    ctx.lineTo(width - 8, 4);
    ctx.lineTo(width - 8, 1);
    ctx.lineTo(1, 1);
    ctx.lineTo(1, 0);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  function draw_arrow(i, j, direction) {
    var x, y;
    x = i * (box_width + gap_width) + 3;
    y = j * (box_height + gap_height) + 3;
    if (direction === 0) {
      x += box_width + arrow_gap;
      y += box_height / 2;
      arrow_shape(x, y, gap_width - arrow_gap * 2, 0);
    } else if (direction === 1) {
      x -= arrow_gap;
      y += box_height / 2;
      arrow_shape(x, y, gap_width - arrow_gap * 2, Math.PI);
    } else if (direction === 2) {
      x += box_width / 2;
      y += box_height + arrow_gap;
      arrow_shape(x, y, gap_height - arrow_gap * 2, Math.PI / 2);
    } else if (direction === 3) {
      x += box_width / 2;
      y -= arrow_gap;
      arrow_shape(x, y, gap_height - arrow_gap * 2, -Math.PI / 2);
    }
  }

  function draw_arrows(i, j) {
    var s, t;
    s = map.grid[j + 1][i + 1];
    t = map.grid[j + 1][i + 2];
    if (conf.arcs[s][t]) {
      draw_arrow(i, j, 0);
    }
    t = map.grid[j + 1][i];
    if (conf.arcs[s][t]) {
      draw_arrow(i, j, 1);
    }
    t = map.grid[j + 2][i + 1];
    if (conf.arcs[s][t]) {
      draw_arrow(i, j, 2);
    }
    t = map.grid[j][i + 1];
    if (conf.arcs[s][t]) {
      draw_arrow(i, j, 3);
    }
  }

  function draw_wire_arrows() {
    var i, j, s, t, x, y, x1, y1,
      path, st, ts, dir,
      paths = map.wire_paths();
    for (i = 0; i < paths.length; i += 1) {
      path = paths[i];
      x = path[0][0];
      y = path[0][1];
      s = map.grid[y][x];
      x = path[path.length - 1][0];
      y = path[path.length - 1][1];
      t = map.grid[y][x];
      st = ts = false;
      if (conf.arcs[s][t]) {
        st = true;
      }
      if (conf.arcs[t][s]) {
        ts = true;
      }
      x = path[0][0] - 1;
      y = path[0][1] - 1;
      for (j = 1; j < path.length; j += 1) {
        x1 = path[j][0] - 1;
        y1 = path[j][1] - 1;
        if (x1 - x > 0) {
          dir = 0;
        } else if (x1 - x < 0) {
          dir = 1;
        } else if (y1 - y > 0) {
          dir = 2;
        } else if (y1 - y < 0) {
          dir = 3;
        }
        if (st) {
          draw_arrow(x, y, dir);
        }
        if (ts) {
          draw_arrow(x1, y1, reversed_dirs[dir]);
        }
        x = x1;
        y = y1;
      }
    }
  }

  function draw_node(i, j, frame_width, frame_color, box_color,
    text, text_color) {
    var x, y;
    x = i * (box_width + gap_width) + 3;
    y = j * (box_height + gap_height) + 3;
    ctx.lineWidth = frame_width;
    ctx.strokeStyle = frame_color;
    ctx.fillStyle = box_color;
    ctx.fillRect(x, y, box_width, box_height);
    ctx.strokeRect(x, y, box_width, box_height);
    x += box_width / 2 - ctx.measureText(text).width / 2;
    y += box_height / 2 + 2;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = text_color;
    ctx.fillText(text, x, y);
  }

  function draw_grid() {
    var i, j, n;
    canvas.width = ui.width * (box_width + gap_width) - gap_width + 6;
    canvas.height = ui.height * (box_height + gap_height) - gap_height + 6;
    for (j = 0; j < ui.height; j += 1) {
      for (i = 0; i < ui.width; i += 1) {
        if (map) {
          n = map.grid[j + 1][i + 1];
          if (n === map.EMPTY) {
            draw_node(i, j, 1, '#808080', 'white', i + ', ' + j, '#808080');
          } else if (n === map.WIRE) {
            draw_node(i, j, 2, '#808080', '#ff9900', 'wire', 'black');
          } else {
            if (conf.fixed[n]) {
              draw_node(i, j, 5, '#808080', '#e0e0e0', conf.names[n],
                'black');
            } else {
              draw_node(i, j, 2, '#808080', '#c0c0c0', conf.names[n],
                'black');
            }
            draw_arrows(i, j);
          }
        } else {
          draw_node(i, j, 1, '#808080', 'white', i + ', ' + j, '#808080');
        }
      }
    }
    if (map) {
      draw_wire_arrows();
    }
  }

  function log(message) {
    document.getElementById('log').innerHTML = '<span id="log_text">' +
      message + '</span>';
  }

  function clear_log() {
    document.getElementById('log').innerHTML = '';
  }

  function get_value(name) {
    return document.getElementById(name).value;
  }

  function set_value(name, v) {
    document.getElementById(name).value = String(v);
  }

  function value_range(v, low, high) {
    if (v.length !== 0 && isFinite(v)) {
      v = Math.round(v);
      if (v >= low && v <= high) {
        return v;
      }
    }
    return false;
  }

  function value_change(name, low, high) {
    var v = value_range(get_value(name), low, high);
    if (v === false) {
      set_value(name, ui[name]);
      return;
    }
    ui[name] = v;
  }

  function new_map() {
    var i, x, y;
    conf = mapper_conf(get_value('graph'));
    if (!conf.ok) {
      log('Syntax error.');
      return;
    }
    if (!conf.fixed.length) {
      log('No fixed nodes found.');
      return;
    }
    if (conf.graph.length > ui.width * ui.height) {
      log('Grid is too small.');
      return;
    }
    for (i = 0; i < conf.graph.length; i += 1) {
      if (conf.graph[i].length > 4) {
        log('Graph is not a 4-graph.');
        return;
      }
    }
    for (i = 0; i < conf.fixed.length; i += 1) {
      if (conf.fixed[i]) {
        x = conf.fixed[i][0];
        y = conf.fixed[i][1];
        if (x >= ui.width || y >= ui.height) {
          log('Fixed node is out of grid bounds.');
          return;
        }
      }
    }
    map = mapper(conf.graph, conf.fixed, ui.width, ui.height, ui.wire_length,
      ui.cycles);
    if (!map.solution()) {
      if (map.aborted()) {
        log('Cycles limit exceeded.');
      } else {
        log('No solution found.');
      }
      map = false;
      return;
    }
  }

  document.getElementById('log').onclick = function () {
    clear_log();
  };

  document.getElementById('map').onclick = function () {
    clear_log();
    map = false;
    new_map();
    draw_grid();
  };

  document.getElementById('optimize').onclick = function () {
    if (!map) {
      return;
    }
    if (!map.solution()) {
      log('No better solution found.');
      map = false;
      return;
    }
    draw_grid();
  };

  document.getElementById('canvas').onclick = function () {
    window.location = canvas.toDataURL('image/png');
  };

  document.getElementById('width').onchange = function () {
    value_change('width', 1, 99);
    map = false;
    draw_grid();
  };

  document.getElementById('height').onchange = function () {
    value_change('height', 1, 99);
    map = false;
    draw_grid();
  };

  document.getElementById('wire_length').onchange = function () {
    value_change('wire_length', 0, 9999);
  };

  document.getElementById('cycles').onchange = function () {
    value_change('cycles', 1, 99999999);
  };

  value_change('width');
  value_change('height');
  value_change('wire_length');
  value_change('cycles');
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  draw_grid();
}());
