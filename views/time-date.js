const html = require('choo/html')
const Comp = require('choo/component')

const months = {
  january: 31,
  february: 28,
  march: 31,
  april: 30,
  may: 31,
  june: 30,
  july: 31,
  august: 31,
  september: 30,
  october: 31,
  november: 30,
  december: 31
}

class TimeDateSelect extends Comp {
  constructor (id, state, emit) {
    super(id)
    this.emit = emit
    this.select = this.select.bind(this)
    this.changeMonth = this.changeMonth.bind(this)
    this.local = state.components[id] = {
      time : undefined
    }
  }

  select () {
    let elem = document.getElementById("select_hour")
    console.log('selected ->', elem.value)
  }

  changeMonth () {
    let elem = document.getElementById("select_month")
    let time = Date.parse(`${elem.value} 1, 2019`)
    this.emit('graph:time', time)
  }

  update (time) {
    return time !== this.local.time
  }

  createElement (time) {
    this.local.time = time

    let selectedMonth = new Date(time).getMonth()
    let optionsMonth = Object.keys(months).map((month, idx) => {
      let cap = month.charAt(0).toUpperCase() + month.slice(1)
      return selectedMonth === idx ? html`<option value=${month} selected="selected">${cap}</option>` :
        html`<option value=${month}>${cap}</option>`
    })

    let selectedDay = new Date(time).getDate()
    let optionsDay = []
    let days = months[Object.keys(months)[selectedMonth]]
    for (var i = 1; i <= days; i++) {
      if (i === selectedDay) {
        optionsDay.push(html`<option value=${i} selected="selected">${i}</option>`)
      } else {
        optionsDay.push(html`<option value=${i}>${i}</option>`)
      }
    }

    let selectedHour = new Date(time).getHours() + 1
    let optionsHour = []
    for (var i = 1; i <= 24; i++) {
      let hour = i <= 12 ? i : i - 12
      let postfix = i <= 12 ? "AM" : "PM"
      if (i === selectedHour) {
        optionsHour.push(html`<option value=${i} selected="selected">${hour+postfix}</option>`)
      } else {
        optionsHour.push(html`<option value=${i}>${hour+postfix}</option>`)
      }
    }

    return html`
      <div>
        <select id="select_month" onchange=${this.changeMonth}>
          ${optionsMonth}
        </select>
        <select id="select_day">
          ${optionsDay}
        </select>
        <select id="select_hour">
          ${optionsHour}
        </select>
        <button onclick=${this.select}>GO!</button>
      </div>
    `
  }
}

module.exports = TimeDateSelect
