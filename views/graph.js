const html = require('choo/html')
const Comp = require('choo/component')
const d3   = require('d3')

module.exports = view

class Graph extends Comp {
  constructor (id, state, emit) {
    super(id)
    this.local = state.components[id] = {
      nodes : [],
      links : [],
      active : -1
    }
  }

  afterupdate (elem) {
    console.log('!!! afterupdate')
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
      width = 400 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    let svg = d3.select(".chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let node = svg
      .selectAll("circle")
      .data(this.local.nodes)
      .enter()
      .append("circle")
        .attr("r", 20)
        .style("fill", "#69b3a2")

    let link = svg
      .selectAll("line")
      .data(this.local.links)
      .enter()
      .append("line")
        .style("stroke", "#aaa")

    let simulation = d3.forceSimulation(this.local.nodes)
      .force("link", d3.forceLink().links(this.local.links).id((d) => d.id))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y)

        node
          .attr("cx", (d) => d.x + 6)
          .attr("cy", (d) => d.y - 6)
      })
    this.drawActive()
  }

  clearActive() {

  }

  drawActive () {

  }

  update (data, active) {
    if (this.local.nodes.length !== data.nodes.length ||
        this.local.links.length !== data.links.length) {
      console.log('!!! update true')
      this.local.nodes = data.nodes.slice()
      this.local.links = data.links.slice()
      return true
    } else if (this.local.active != active) {
      this.clearActive()
      this.local.active = active
      this.drawActive()
    }
    console.log('!!! update false')
    return false
  }

  createElement (data, active) {
    console.log('!!! create')
    this.local.nodes = data.nodes.slice()
    this.local.links = data.links.slice()
    this.local.active = active
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
    ${state.cache(Graph, 'graph').render(state.data, state.active)}
  </body>`
}
