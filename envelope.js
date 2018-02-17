class Envelope {
  constructor(x1, y1, x2, y2) {
    this.easing = bezier(x1, y1, x2, y2)
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
  }

  set(x1, y1, x2, y2) {
    this.easing = bezier(x1, y1, x2, y2)
  }

  attack(value) {
    return this.easing(value)
  }

  decay(value) {
    return 1 - this.easing(value)
  }

  // Return lookup table of envelope. This will be used for drawing UI.
  makeTable(length) {
    var table = new Array(length)
    var denom = length - 1
    for (var i = 0; i < table.length; ++i) {
      table[i] = this.decay(i / denom)
    }
    return table
  }
}

class ExpDecay {
  // https://en.wikipedia.org/wiki/Exponential_decay
  constructor(length, endValue = 1e-5) {
    this.gamma = Math.pow(endValue, 1 / length)
    this.value = 1
  }

  process(input) {
    var output = input * this.value
    this.value *= this.gamma
    return output
  }
}

class CosDecay {
  constructor(length) {
    this.length = length - 1
    this.n = 0
  }

  process(input) {
    return input * (1 + Math.cos(Math.PI * this.n++ / this.length)) / 2
  }
}