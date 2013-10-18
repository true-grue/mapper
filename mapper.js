// mapper.js
// Peter Sovietov

var mapper = function (graph, fixed, width, height, wire_length, cycles) {
  var levels, nodes, grid,
    dirs = [], traces = [], queues = [],
    x_dirs = [0, 0, 1, -1], y_dirs = [-1, 1, 0, 0],
    max_wires, wires, cycle_no,
    current_level, current_node, optimize,
    EMPTY = -1, WIRE = -2,
    i, j, x, y, fixed_nodes = [];

  function make_array(e, times) {
    var i, a = [];
    for (i = 0; i < times; i += 1) {
      a[i] = e;
    }
    return a;
  }

  function make_grid(width, height) {
    var i, r = [];
    width += 2;
    height += 2;
    for (i = 0; i < height; i += 1) {
      r[i] = make_array(EMPTY, width);
    }
    for (i = 0; i < width; i += 1) {
      r[0][i] = WIRE;
      r[height - 1][i] = WIRE;
    }
    for (i = 1; i < height - 1; i += 1) {
      r[i][0] = WIRE;
      r[i][width - 1] = WIRE;
    }
    return r;
  }

  function build_levels(graph, fixed) {
    var i, queue, ins, outs,
      first, current, last,
      branch_ins, branch_outs,
      cycle_ins, cycle_outs,
      src, dst, r = [];
    queue = make_array(0, graph.length);
    ins = make_array(0, graph.length);
    outs = make_array(0, graph.length);
    for (i = 0; i < fixed.length; i += 1) {
      queue[i] = fixed[i];
      ins[fixed[i]] = 1;
    }
    first = 0;
    current = last = fixed.length;
    while (first < last) {
      branch_ins = [];
      branch_outs = [];
      cycle_ins = [];
      cycle_outs = [];
      while (first < current) {
        src = queue[first];
        first += 1;
        if (outs[src] === 0) {
          outs[src] = 1;
          for (i = 0; i < graph[src].length; i += 1) {
            dst = graph[src][i];
            if (outs[dst] === 0) {
              if (ins[dst] === 0) {
                ins[dst] = 1;
                branch_ins.push(src);
                branch_outs.push(dst);
                queue[last] = dst;
                last += 1;
              } else {
                cycle_ins.push(src);
                cycle_outs.push(dst);
              }
            }
          }
        }
      }
      r.push([branch_ins, branch_outs, cycle_ins, cycle_outs]);
      current = last;
    }
    return r;
  }

  function draw_wire(x, y, source, traces, queue) {
    var pos;
    while (grid[y][x] !== source) {
      grid[y][x] = WIRE;
      pos = traces[y][x];
      x = queue[pos];
      y = queue[pos + 1];
    }
  }

  function wire_path(source, target, traces, queue) {
    var target_x, target_y, pos, x, y,
      path = [];
    target_x = nodes[target * 2];
    target_y = nodes[target * 2 + 1];
    pos = traces[target_y][target_x];
    x = queue[pos];
    y = queue[pos + 1];
    path.push([target_x, target_y]);
    while (grid[y][x] !== source) {
      path.push([x, y]);
      pos = traces[y][x];
      x = queue[pos];
      y = queue[pos + 1];
    }
    path.push([x, y]);
    return path;
  }

  function wire_paths() {
    var level_no, level, sources, targets, traces1, queues1,
      i, path, paths = [];
    for (level_no = 0; level_no < levels.length; level_no += 1) {
      level = levels[level_no];
      sources = level[2];
      targets = level[3];
      if (sources.length) {
        traces1 = traces[level_no];
        queues1 = queues[level_no];
        for (i = 0; i < sources.length; i += 1) {
          path = wire_path(sources[i], targets[i], traces1[i], queues1[i]);
          if (path.length > 2) {
            paths.push(path);
          }
        }
      }
    }
    return paths;
  }

  function route(source, target, traces, queue) {
    var i, first, last, current, steps, max_steps,
      x, y, dx, dy, n;
    for (i = 0; i < queue[queue.length - 1]; i += 2) {
      traces[queue[i + 1]][queue[i]] = EMPTY;
    }
    queue[0] = nodes[source * 2];
    queue[1] = nodes[source * 2 + 1];
    traces[queue[1]][queue[0]] = 0;
    first = 0;
    last = 2;
    current = last;
    steps = 0;
    max_steps = Math.min(wire_length, max_wires - wires);
    while (steps <= max_steps && first < last) {
      while (first < current) {
        x = queue[first];
        y = queue[first + 1];
        for (i = 0; i < 4; i += 1) {
          dx = y_dirs[i];
          dy = x_dirs[i];
          n = grid[y + dy][x + dx];
          if ((n === EMPTY && traces[y + dy][x + dx] === EMPTY)
              || n === target) {
            traces[y + dy][x + dx] = first;
            queue[last] = x + dx;
            queue[last + 1] = y + dy;
            last += 2;
            if (n === target) {
              wires += steps;
              draw_wire(x, y, source, traces, queue);
              queue[queue.length - 1] = last;
              return true;
            }
          }
        }
        first += 2;
      }
      current = last;
      steps += 1;
    }
    queue[queue.length - 1] = last;
    return false;
  }

  function draw_node(source, target, direction) {
    var dx, dy, x, y;
    dx = x_dirs[direction];
    dy = y_dirs[direction];
    x = nodes[source * 2] + dx;
    y = nodes[source * 2 + 1] + dy;
    if (grid[y][x] === EMPTY) {
      grid[y][x] = target;
      nodes[target * 2] = x;
      nodes[target * 2 + 1] = y;
      return true;
    }
    return false;
  }

  function erase_wire(source, target, traces, queue) {
    var target_x, target_y, pos, x, y;
    target_x = nodes[target * 2];
    target_y = nodes[target * 2 + 1];
    pos = traces[target_y][target_x];
    x = queue[pos];
    y = queue[pos + 1];
    while (grid[y][x] !== source) {
      wires -= 1;
      grid[y][x] = EMPTY;
      pos = traces[y][x];
      x = queue[pos];
      y = queue[pos + 1];
    }
  }

  function erase_wires(level_no) {
    var level, targets, traces1, queues1,
      i, source;
    level = levels[level_no];
    if (level[2].length) {
      targets = level[3];
      traces1 = traces[level_no];
      queues1 = queues[level_no];
      for (i = 0; i < level[2].length; i += 1) {
        source = level[2][i];
        erase_wire(source, targets[i], traces1[i], queues1[i]);
      }
    }
  }

  function advance_node(level, dirs, node_no) {
    var x, y;
    dirs[node_no] += 1;
    x = nodes[level[1][node_no] * 2];
    y = nodes[level[1][node_no] * 2 + 1];
    grid[y][x] = EMPTY;
    return dirs.length - 1;
  }

  function advance_level(level_no) {
    var level, last;
    erase_wires(level_no);
    level = levels[level_no];
    if (level[0].length) {
      last = dirs[level_no].length - 1;
      return advance_node(level, dirs[level_no], last);
    }
    return 1;
  }

  function erase_nodes(level_no) {
    var level, i, target, x, y, dirs1;
    level = levels[level_no];
    if (level[0].length) {
      for (i = 0; i < level[1].length; i += 1) {
        target = level[1][i];
        x = nodes[target * 2];
        y = nodes[target * 2 + 1];
        grid[y][x] = EMPTY;
      }
      dirs1 = dirs[level_no];
      for (i = 0; i < dirs1.length; i += 1) {
        dirs1[i] = 0;
      }
    }
  }

  function draw_wires(level, traces, queues) {
    var sources, targets, i, source, j;
    sources = level[2];
    targets = level[3];
    for (i = 0; i < sources.length; i += 1) {
      source = sources[i];
      if (!route(source, targets[i], traces[i], queues[i])) {
        for (j = 0; j < i; j += 1) {
          erase_wire(sources[j], targets[j], traces[j], queues[j]);
        }
        return false;
      }
    }
    return true;
  }

  function draw_nodes(level, dirs, no) {
    var sources, targets;
    sources = level[0];
    targets = level[1];
    while (no < sources.length) {
      while (dirs[no] < 4 && !draw_node(sources[no], targets[no], dirs[no])) {
        dirs[no] += 1;
      }
      if (dirs[no] < 4) {
        no += 1;
      } else {
        dirs[no] = 0;
        if (no === 0) {
          return false;
        }
        no -= 1;
        advance_node(level, dirs, no);
      }
    }
    return true;
  }

  function draw_level(level_no, node_no) {
    var level, traces1, queues1, dirs1, last;
    level = levels[level_no];
    traces1 = traces[level_no];
    queues1 = queues[level_no];
    if (!level[0].length) {
      if (node_no === 0) {
        return draw_wires(level, traces1, queues1);
      }
      return false;
    }
    dirs1 = dirs[level_no];
    while (draw_nodes(level, dirs1, node_no)) {
      if (draw_wires(level, traces1, queues1)) {
        return true;
      }
      last = dirs1.length - 1;
      node_no = advance_node(level, dirs1, last);
    }
    return false;
  }

  function place_and_route(level_no, node_no) {
    cycle_no = cycles;
    while (level_no < levels.length) {
      cycle_no -= 1;
      if (cycle_no < 0) {
        return false;
      }
      if (draw_level(level_no, node_no)) {
        level_no += 1;
        node_no = 0;
      } else {
        if (level_no === 0) {
          return false;
        }
        level_no -= 1;
        node_no = advance_level(level_no);
      }
    }
    return true;
  }

  function backtrack() {
    var level, last;
    max_wires = wires - 1;
    current_level = levels.length - 1;
    erase_wires(current_level);
    while (wires > max_wires) {
      erase_nodes(current_level);
      current_level -= 1;
      erase_wires(current_level);
    }
    level = levels[current_level];
    if (level[0].length) {
      last = dirs[current_level].length - 1;
      return advance_node(level, dirs[current_level], last);
    }
    return 1;
  }

  function solution() {
    if (optimize) {
      if (wires === 0) {
        return false;
      }
      current_node = backtrack();
      optimize = false;
    }
    if (place_and_route(current_level, current_node)) {
      optimize = true;
      return true;
    }
    return false;
  }

  nodes = make_array(0, graph.length * 2);
  grid = make_grid(width, height);
  for (i = 0; i < fixed.length; i += 1) {
    if (fixed[i]) {
      x = fixed[i][0];
      y = fixed[i][1];
      if (grid[y + 1][x + 1] === EMPTY) {
        fixed_nodes.push(i);
        nodes[i * 2] = x + 1;
        nodes[i * 2 + 1] = y + 1;
        grid[y + 1][x + 1] = i;
      }
    }
  }
  levels = build_levels(graph, fixed_nodes);
  for (i = 0; i < levels.length; i += 1) {
    dirs[i] = make_array(0, levels[i][0].length);
  }
  for (i = 0; i < levels.length; i += 1) {
    x = [];
    y = [];
    for (j = 0; j < levels[i][2].length; j += 1) {
      x.push(make_grid(width, height));
      y.push(make_array(0, width * height * 2 + 1));
    }
    traces.push(x);
    queues.push(y);
  }
  max_wires = width * height - graph.length;
  wires = 0;
  current_level = 0;
  current_node = 0;
  optimize = false;
  return {
    EMPTY: EMPTY,
    WIRE: WIRE,
    grid: grid,
    solution: solution,
    wire_paths: wire_paths,
    aborted: function () { return cycle_no < 0; }
  };
};
