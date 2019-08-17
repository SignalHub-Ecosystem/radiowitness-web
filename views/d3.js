const html = require('choo/html')
const Comp = require('choo/component')
const d3   = require('d3')
const dat  = require('../dat.json')

module.exports = view

function drag (simulation) {
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

function color (d) {
  if (d.group == "Cited Works") return "blue"
  else return "orange"
}

class Graph extends Comp {
  constructor (id, state, emit) {
    super(id)
    this.local = state.components[id] = {
      x : 0,
      y : 120
    }
  }

  load (elem) {
    console.log('!!! load()')
    let data = d3.json("https://gist.githubusercontent.com/mbostock/74cb803c013404ac30e63f020a52a2fd/raw/c7c74c939b602c56c80848963f9ad24802baaead/graph.json")
    data.then(this.next)
  }

  next(data) {
    let height = 800
    let width = 1024
    const links = data.links.map(d => Object.create(d));
    const nodes = data.nodes.map(d => Object.create(d));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    const svg = d3.select(".chart").append("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", 5)
      .attr("fill", color)
      .call(drag(simulation));

    node.append("title")
        .text(d => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    invalidation.then(() => simulation.stop()); 
  }

  update (posx) {
    return false
  }

  createElement (posx) {
    this.local.x = posx
    return html`<div class="chart"></div>`
  }

  unload (elem) {
    console.log('!!! unload()', elem)
  }
}

function view (state, emit) {
  const TITLE = 'd3 thing'
  if (state.title !== TITLE) {
    emit(state.events.DOMTITLECHANGE, TITLE)
  }

  return html`<body>
    <h2>d3</h2>
    <p>database -> ${state.db.msg}</p>
    <p>studio -> ${state.studio.msg}</p>
    ${state.cache(Graph, 'graph').render(state.idk)}
  </body>`
}
