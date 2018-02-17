class Canvas {
  constructor(parent, width, height) {
    this.element = document.createElement("canvas")
    this.width = width
    this.height = height
    this.element.width = width
    this.element.height = height
    this.context = this.element.getContext("2d")
    this.imageData = this.context.getImageData(0, 0, width, height)
    this.pixels = this.imageData.data
    parent.appendChild(this.element)

    this.center = this.getCenter()
  }

  get CurrentPixels() {
    this.imageData = this.context.getImageData(0, 0, this.element.width, this.element.height)
    this.pixels = this.imageData.data
    return this.pixels
  }

  set visible(isVisible) {
    if (isVisible) {
      this.element.sytle.display = "inline"
    }
    else {
      this.element.style.display = "none"
    }
  }

  getCenter() {
    return new Vec2(this.element.width / 2, this.element.height / 2)
  }

  preparePath(poly) {
    if (poly.length < 1) {
      return
    }

    this.context.beginPath()
    this.context.moveTo(poly[0].x, poly[0].y)
    for (let i = 1; i < poly.length; ++i) {
      this.context.lineTo(poly[i].x, poly[i].y)
    }
  }

  preparePolygon(poly) {
    this.preparePath(poly)
    this.context.closePath()
  }

  drawPath(poly) { // compat
    this.drawPolygon(poly)
  }

  drawPolygon(poly) {
    this.preparePolygon(poly)
    this.context.fill()
    this.context.stroke()
  }

  drawPoints(points, radius) {
    for (let index = 0; index < points.length; ++index) {
      this.drawPoint(points[index], radius)
    }
  }

  drawNumbers(points) {
    for (let index = 0; index < points.length; ++index) {
      this.context.fillText(index, points[index].x, points[index].y)
    }
  }

  drawText(point, text) {
    // this.context.font = "12px serif"
    this.context.fillText(text, point.x, point.y)
  }

  drawLine(a, b) {
    this.context.beginPath()
    this.context.moveTo(a.x, a.y)
    this.context.lineTo(b.x, b.y)
    this.context.stroke()
  }

  drawPoint(point, radius) {
    this.context.beginPath()
    this.context.arc(point.x, point.y, radius, 0, Math.PI * 2, false)
    this.context.fill()
  }

  drawCircle(point, radius) {
    this.context.beginPath()
    this.context.arc(point.x, point.y, radius, 0, Math.PI * 2, false)
    this.context.fill()
    this.context.stroke()
  }

  clearWhite() {
    this.context.fillStyle = "#ffffff"
    this.context.fillRect(0, 0, this.element.width, this.element.height)
    this.context.fill()
  }

  clear(color) {
    this.context.fillStyle = color
    this.context.fillRect(0, 0, this.element.width, this.element.height)
    this.context.fill()
  }

  resetTransform() {
    this.context.transform(1, 0, 0, 1, 0, 0)
  }

  putPixels() {
    this.context.putImageData(this.imageData, 0, 0)
  }

  setPixel(x, y, color) {
    var index = (y * this.element.width + x) * 4
    this.pixels[index + 0] = color.r
    this.pixels[index + 1] = color.g
    this.pixels[index + 2] = color.b
    this.pixels[index + 3] = color.a
  }

  feedback(alpha, white) {
    for (var y = 0; y < this.element.height; ++y) {
      for (var x = 0; x < this.element.width; ++x) {
        var index = (y * this.element.width + x) * 4
        this.pixels[index + 0] = Math.min(this.pixels[index + 0] * white, 255) // R
        this.pixels[index + 1] = Math.min(this.pixels[index + 1] * white, 255) // G
        this.pixels[index + 2] = Math.min(this.pixels[index + 2] * white, 255) // B
        this.pixels[index + 3] *= alpha // A
      }
    }
    this.context.putImageData(this.imageData, 0, 0)
  }
}

class Timer {
  constructor() {
    this.now = Date.now() * 0.001
    this.delta = 0
    this.zero = this.now
    this.lap = 0
    this.isPause = true
  }

  tick() {
    var now = Date.now() * 0.001
    if (this.isPause) {
      this.isPause = false
      this.delta = 0
    }
    else {
      this.delta = now - this.now
      this.lap += this.delta
    }
    this.now = now
  }

  pause() {
    this.isPause = true
  }
}

class Div {
  constructor(parent, id, className = "") {
    this.element = document.createElement("div")
    this.element.id = id
    if (className.length > 0) {
      this.element.classList.add(className)
    }
    parent.appendChild(this.element)
  }
}

class Heading {
  constructor(parent, level, text) {
    this.element = document.createElement("h" + level)
    this.element.textContent = text
    parent.appendChild(this.element)
  }
}

class Description {
  constructor(parent) {
    this.details = document.createElement("details")
    this.details.id = "description"
    parent.appendChild(this.details)

    this.summary = document.createElement("summary")
    this.summary.textContent = "使い方"
    this.details.appendChild(this.summary)

    this.dl = document.createElement("dl")
    this.details.appendChild(this.dl)
  }

  add(term, description) {
    var dt = document.createElement("dt")
    dt.textContent = term
    this.details.appendChild(dt)

    var dd = document.createElement("dd")
    dd.textContent = description
    this.details.appendChild(dd)
  }
}

class Button {
  constructor(parent, label, onClickFunc) {
    this.element = document.createElement("input")
    this.element.type = "button"
    this.element.value = label
    parent.appendChild(this.element)
    this.element.addEventListener("click", (event) => this.onClick(event), false)
    this.element.addEventListener("keyup", (event) => this.onKeyUp(event), false)
    this.onClickFunc = onClickFunc
  }

  onClick(event) {
    this.onClickFunc(event)
  }

  onKeyUp(event) {
    if (event.keyCode === 32) {
      event.preventDefault()
    }
  }
}

class Checkbox {
  constructor(parent, label, checked, onChangeFunc) {
    this.onChangeFunc = onChangeFunc
    this.value = checked

    this.input = document.createElement("input")
    this.input.type = "checkbox"
    if (checked) {
      this.input.setAttribute("checked", checked)
    }

    this.label = document.createElement("label")
    this.label.className = "checkbox"
    this.label.addEventListener("change", (event) => this.onChange(event), false)
    this.label.innerHTML = this.input.outerHTML + label
    parent.appendChild(this.label)
  }

  get element() {
    return this.label
  }

  onChange(event) {
    this.value = event.target.checked
    this.onChangeFunc(this.value)
  }
}

class RadioButton {
  // nameが""だと正しく動かない。
  constructor(parent, name, onChangeFunc) {
    this.name = name
    this.onChangeFunc = onChangeFunc
    this.buttons = []
    this.value = null

    this.div = document.createElement("div")
    this.div.className = "radioButton"
    parent.appendChild(this.div)

    this.divLabel = document.createElement("div")
    this.divLabel.className = "radioButtonLabel"
    this.divLabel.textContent = name
    this.div.appendChild(this.divLabel)

    this.divButtons = document.createElement("div")
    this.divButtons.className = "radioButtonControls"
    this.div.appendChild(this.divButtons)
  }

  onChange(event) {
    this.value = event.target.value
    this.onChangeFunc(this.value)
  }

  add(label) {
    var input = document.createElement("input")
    input.type = "radio"
    input.name = this.name
    input.value = label
    if (this.buttons.length <= 0) {
      input.setAttribute("checked", true)
      this.value = label
    }
    this.buttons.push(input)

    var labelElement = document.createElement("label")
    labelElement.addEventListener("change", (event) => this.onChange(event), false)
    labelElement.innerHTML = input.outerHTML + label
    this.divButtons.appendChild(labelElement)
  }
}

class NumberInput {
  constructor(parent, label, value, min, max, step, onInputFunc) {
    this.defaultValue = value
    this.min = min
    this.max = max
    this.step = step
    this.onInputFunc = onInputFunc

    this.div = document.createElement("div")
    this.div.className = "numberInput"
    this.divLabel = document.createElement("div")
    this.divLabel.className = "numberInputLabel"
    this.divLabel.textContent = label
    this.div.appendChild(this.divLabel)
    this.range = this.addInput("range", value, min, max, step)
    this.range.className = "numberInputRange"
    this.number = this.addInput("number", value, min, max, step)
    this.number.className = "numberInputNumber"
    parent.appendChild(this.div)

    this.range.addEventListener("change", (event) => this.onInput(event), false)
    this.number.addEventListener("change", (event) => this.onInput(event), false)
  }

  clamp(value) {
    if (isNaN(value)) {
      return this.defaultValue
    }
    return Math.max(this.min, Math.min(value, this.max))
  }

  onInput(event) {
    var value = this.clamp(event.target.valueAsNumber)
    this.range.value = value
    this.number.value = value
    this.onInputFunc(value)
  }

  get value() {
    return parseFloat(this.number.value)
  }

  set value(value) {
    this.clamp(value)
    this.range.value = value
    this.number.value = value
  }

  random() {
    var randomStep = Math.floor(Math.random() * (this.max - this.min) / this.step)
    var value = randomStep * this.step + this.min
    this.range.value = value
    this.number.value = value
  }

  addInput(type, value, min, max, step) {
    var input = document.createElement("input")
    this.div.appendChild(input)
    input.type = type
    input.min = min
    input.max = max
    input.step = step
    input.value = value
    return input
  }
}

class PullDownMenu {
  constructor(parent, label, onChangeFunc) {
    this.onChangeFunc = onChangeFunc
    this.value = null
    this.options = []

    this.div = document.createElement("div")
    this.div.className = "pullDownMenu"
    if (typeof label === 'string' || label instanceof String) {
      this.divLabel = document.createElement("div")
      this.divLabel.className = "numberInputLabel"
      this.divLabel.textContent = label
      this.div.appendChild(this.divLabel)
    }
    this.select = document.createElement("select")
    this.div.appendChild(this.select)
    parent.appendChild(this.div)

    this.select.addEventListener("change", (event) => this.onChange(event), false)
  }

  onChange(event) {
    this.value = event.target.value
    this.onChangeFunc(this.value)
  }

  add(label) {
    if (typeof label !== 'string' && !(label instanceof String)) {
      console.log("PullDownMenu.add() failed to invalid type.")
    }
    var option = document.createElement('option')
    option.textContent = label
    if (this.options.length <= 0) {
      this.value = label
    }
    this.options.push(option)
    this.select.appendChild(option)
  }
}
