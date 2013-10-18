// mapper_conf.js
// Peter Sovietov

var mapper_conf = function (text) {
  var pos = 0, old = '', state = '',
    arcs = [], names = [], nodes = [],
    graph = [], fixed = [];

  function skip() {
    while (pos < text.length) {
      if (text.charAt(pos) === ';') {
        while (pos < text.length && text.charAt(pos) !== '\n') {
          pos += 1;
        }
      } else if (text.charAt(pos) > ' ') {
        return;
      }
      pos += 1;
    }
  }

  function isdigit(ch) {
    return (ch >= '0' && ch <= '9');
  }

  function isalpha(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }

  function token(f) {
    var ch, t = '';
    skip();
    while (pos < text.length) {
      ch = text.charAt(pos);
      if (!f(ch)) {
        break;
      }
      t += ch;
      pos += 1;
    }
    return t;
  }

  function symbol(pattern) {
    skip();
    if (pattern === text.slice(pos, pos + pattern.length)) {
      pos += pattern.length;
      return true;
    }
    return false;
  }

  function indexof(a, e) {
    var i;
    for (i = 0; i < a.length; i += 1) {
      if (a[i] === e) {
        return i;
      }
    }
    return -1;
  }

  function edge(n1, n2) {
    if (indexof(graph[n1], n2) < 0) {
      graph[n1].push(n2);
    }
    if (indexof(graph[n2], n1) < 0) {
      graph[n2].push(n1);
    }
    arcs[n1][n2] = 1;
  }

  function node() {
    var t;
    t = token(function (ch) {
      return isdigit(ch) || isalpha(ch) || ch === '_';
    });
    if (t === '') {
      if (pos < text.length) {
        state = 'error';
      }
      return false;
    }
    if (nodes[t] === undefined) {
      nodes[t] = names.length;
      names.push(t);
      if (graph[nodes[t]] === undefined) {
        graph[nodes[t]] = [];
        arcs[nodes[t]] = [];
      }
    }
    if (state === 'arrow') {
      if (old === '') {
        state = 'error';
        return false;
      }
      edge(nodes[old], nodes[t]);
    }
    old = t;
    state = 'node';
    return true;
  }

  function xy() {
    var x, y;
    if (!symbol('(')) {
      return true;
    }
    x = token(function (ch) { return isdigit(ch); });
    if (x === '' || old === '') {
      state = 'error';
      return false;
    }
    symbol(',');
    y = token(function (ch) { return isdigit(ch); });
    if (y === '') {
      state = 'error';
      return false;
    }
    symbol(')');
    fixed[nodes[old]] = [+x, +y];
    return true;
  }

  function arrow() {
    if (symbol('->')) {
      state = 'arrow';
    }
  }

  while (node() && xy()) {
    arrow();
  }
  return {
    ok: state !== 'error',
    names: names,
    graph: graph,
    fixed: fixed,
    arcs: arcs
  };
};
