const html = require('choo/html')
const Comp = require('choo/component')
const d3   = require('d3')
const dat  = require('../dat.json')

module.exports = view

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
    let data = d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_network.json")
    data.then(this.graph.bind(this))
  }


  graph(data) {
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
      width = 400 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    var svg = d3.select(".chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var link = svg
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
        .style("stroke", "#aaa")

    var node = svg
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
        .attr("r", 20)
        .style("fill", "#69b3a2")

    var simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink()
        .links(data.links)
        .id((d) => d.id)
      ).force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node
          .attr("cx", (d) => d.x + 6)
          .attr("cy", (d) => d.y - 6);
      });
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
