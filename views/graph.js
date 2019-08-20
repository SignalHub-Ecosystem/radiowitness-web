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
      width = 800 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

    let svg = d3.select(".chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.local.svg = svg

    let node = svg
      .selectAll("circle")
      .data(this.local.nodes)
      .enter()
      .append("circle")
        .attr("id", (d) => d.id)
        .attr("r", 5)
        .style("fill", "#69b3a2")

    let link = svg
      .selectAll("line")
      .data(this.local.links)
      .enter()
      .append("line")
        .style("stroke", "#aaa")

    let simulation = d3.forceSimulation(this.local.nodes)
      .force("link", d3.forceLink().links(this.local.links).id((d) => d.id))
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y)

        node
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
      })
    this.drawActive()
  }

  drawActive () {
    this.local.svg.selectAll("circle")
      .style("fill", "#69b3a2")
      .filter((node) => node.id === this.local.active)
      .style("fill", "red")
  }

  update (data, active) {
    if (this.local.nodes.length !== data.nodes.length ||
        this.local.links.length !== data.links.length) {
      console.log('!!! update true')
      this.local.nodes = data.nodes.map(Object.create)
      this.local.links = data.links.map(Object.create)
      return true
    } else if (this.local.active != active) {
      this.local.active = active
      this.drawActive()
    }
    console.log('!!! update false')
    return false
  }

  createElement (data, active) {
    console.log('!!! create')
    this.local.nodes = data.nodes.map(Object.create)
    this.local.links = data.links.map(Object.create)
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

  const next = () => emit('graph:next')

  return html`<body>
    <h2>d3</h2>
    <p>database -> ${state.db.msg}</p>
    <p>studio -> ${state.studio.msg}</p>
    <button onclick=${next}>NEXT!</button>
    ${state.cache(Graph, 'graph').render(state.data, state.active)}
  </body>`
}
