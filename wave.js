class Wave {
  constructor(channels) {
    this.data = []
    for (var i = 0; i < channels; ++i) {
      this.data.push([])
    }
  }

  get frames() {
    return this.data[0].length
  }

  get channels() {
    return this.data.length
  }

  get left() {
    return this.data[0]
  }

  set left(data) {
    this.data[0] = data
  }

  get right() {
    return this.data[1]
  }

  set right(data) {
    this.data[1] = data
  }

  isMono() {
    if (this.data.length === 1) {
      return true
    }
    return false
  }

  isStereo() {
    if (this.data.length === 2) {
      return true
    }
    return false
  }

  // 左右のチャンネルの長さを 0 で埋めてそろえる。
  align() {
    var maxLength = 0
    for (var i = 0; i < this.data.length; ++i) {
      if (maxLength < this.data[i].length) {
        maxLength = this.data[i].length
      }
    }
    for (var i = 0; i < this.data.length; ++i) {
      for (var j = this.data[i].length; j < maxLength; ++j) {
        this.data[i].push(0)
      }
    }
  }

  findPeak() {
    var peak = null
    var max = -Number.MAX_VALUE
    for (var channel = 0; channel < this.data.length; ++channel) {
      for (var sample = 0; sample < this.data[channel].length; ++sample) {
        var value = Math.abs(this.data[channel][sample])
        if (max < value) {
          max = value
          peak = { channel, sample, value }
        }
      }
    }
    return peak
  }

  // 引数を指定しない場合は this.data のピーク値を1.0として正規化。
  normalize(divisor) {
    var peakValue = divisor
    if (!Number.isFinite(divisor)) {
      var peak = this.findPeak()
      if (peak === null || peak.value === 0) {
        console.log("findPeak failed.")
        return
      }
      this.peakValue = peak.value
      peakValue = this.peakValue
    }

    for (var i = 0; i < this.data.length; ++i) {
      for (var j = 0; j < this.data[i].length; ++j) {
        this.data[i][j] /= peakValue
      }
    }
  }

  declick(fadein, fadeout) {
    this.declickIn(fadein)
    this.declickOut(fadeout)
  }

  declickRatio(fadein, fadeout) {
    var length = this.data[0].length
    this.declickIn(Math.floor(length * fadein / 100))
    this.declickOut(Math.floor(length * fadeout / 100))
  }

  declickIn(fadeLength) {
    for (var channel = 0; channel < this.data.length; ++channel) {
      var length = Math.min(fadeLength, this.data[channel].length)
      var coefficient = Math.pow(256, 1 / length)
      var gain = coefficient / 256
      for (var sample = 0; sample < length; ++sample) {
        this.data[channel][sample] *= gain
        gain *= coefficient
      }
    }
  }

  declickOut(fadeLength) {
    for (var channel = 0; channel < this.data.length; ++channel) {
      var length = Math.min(fadeLength, this.data[channel].length)
      var coefficient = Math.pow(256, 1 / length)
      var gain = coefficient / 256
      var last = this.data[channel].length - 1
      for (var sample = 0; sample < length; ++sample) {
        this.data[channel][last - sample] *= gain
        gain *= coefficient
      }

      length = Math.min(32, this.data[channel].length)
      for (var sample = 0; sample < length; ++sample) {
        this.data[channel][last - sample]
          *= 0.5 - Math.cos(Math.PI * sample / length) / 2
      }
    }
  }

  zeroOut(fadeLength) {
    for (var channel = 0; channel < this.data.length; ++channel) {
      var length = Math.min(fadeLength, this.data[channel].length)
      var last = this.data[channel].length - 1
      for (var sample = 0; sample < length; ++sample) {
        this.data[channel][last - sample]
          *= 0.5 - Math.cos(Math.PI * sample / length) / 2
      }
    }
  }

  trim() {
    var threshold = 1e-3
    var start = this.frames
    var end = 0
    for (var channel = 0; channel < this.data.length; ++channel) {
      var length = this.data[channel].length
      for (var sample = 0; sample < length; ++sample) {
        var sampleAbs = Math.abs(this.data[channel][sample])
        if (sampleAbs >= threshold && start > sample) {
          start = sample
          continue
        }
      }
      for (var sample = length - 1; sample >= 0; --sample) {
        var sampleAbs = Math.abs(this.data[channel][sample])
        if (sampleAbs >= threshold && end < sample) {
          end = sample
          continue
        }
      }
    }
    // console.log(start, end)
    for (var channel = 0; channel < this.data.length; ++channel) {
      this.data[channel] = this.data[channel].slice(start, end + 1)
    }
  }

  copyChannel(channel) {
    for (var ch = 0; ch < this.channels; ++ch) {
      if (channel !== ch) {
        this.data[ch] = Array.from(this.data[channel])
      }
    }
  }

  static fileHeader(sampleRate, channels, bufferLength) {
    var format = this.fileFormat(sampleRate, 32, channels)

    var riff = this.stringToAscii("RIFF")
    var riffChunkSize = this.uint32buffer(50 + bufferLength)
    var wave = this.stringToAscii("WAVE")
    var fmt_ = this.stringToAscii("fmt ")
    var fmtChunkSize = this.uint32buffer(18)
    var formatTag = this.uint16buffer(0x0003) // IEEE 32bit float
    var channels = this.uint16buffer(format.channels)
    var samplePerSec = this.uint32buffer(format.sampleRate)
    var bytesPerSec = this.uint32buffer(format.sampleRate * format.bytesPerFrame)
    var blockAlign = this.uint16buffer(format.bytesPerFrame)
    var bitsPerSample = this.uint16buffer(format.sampleSize)
    var cbSize = this.uint16buffer(0x0000)
    var fact = this.stringToAscii("fact")
    var factChunkSize = this.uint32buffer(4)
    var sampleLength = this.uint32buffer(bufferLength / format.bytesPerFrame)
    var data = this.stringToAscii("data")
    var dataChunkSize = this.uint32buffer(bufferLength)

    return this.concatTypedArray(riff, riffChunkSize, wave, fmt_,
      fmtChunkSize, formatTag, channels, samplePerSec, bytesPerSec,
      blockAlign, bitsPerSample, cbSize, fact, factChunkSize, sampleLength,
      data, dataChunkSize)
  }

  // Wave ファイルの出力。Node.js 上でのみ動作。
  // 2チャンネルのデータまで対応。
  // フォーマットは IEEE 32bit float で固定。
  // http://www-mmsp.ece.mcgill.ca/documents/audioformats/wave/wave.html
  static write(filename, wave, sampleRate) {
    if (wave.data.length <= 0 || wave.data.length > 2) {
      console.log("WaveFile Write failed: wave.data.length <= 0 || wave.data.length > 2.")
    }

    var format = this.fileFormat(sampleRate, 32, wave.channels)
    var buffer = this.toBuffer(wave, format.channels)
    var header = wave.fileHeader(format.sampleRate, wave.channels,
      buffer.length)

    var fs = require("fs")
    var wstream = fs.createWriteStream(filename)
    wstream.write(Buffer.from(header))
    // いったん Uint8Array に直さないと Buffer.from() はうまく動かない。
    wstream.write(Buffer.from(buffer))
    wstream.end()
  }

  static uint16buffer(value) {
    var array = new Uint16Array(1)
    array[0] = value
    return array
  }

  static uint32buffer(value) {
    var array = new Uint32Array(1)
    array[0] = value
    return array
  }

  static stringToAscii(string) {
    var ascii = new Uint8Array(string.length)
    for (var i = 0; i < string.length; ++i) {
      ascii[i] = string.charCodeAt(i)
    }
    return ascii
  }

  static concatTypedArray() {
    var length = 0
    for (var i = 0; i < arguments.length; ++i) {
      length += arguments[i].byteLength
    }
    var array = new Uint8Array(length)
    var index = 0
    for (var i = 0; i < arguments.length; ++i) {
      var uint8 = new Uint8Array(arguments[i].buffer)
      for (var j = 0; j < uint8.length; ++j) {
        array[index] = uint8[j]
        ++index
      }
    }
    return array
  }

  // 複数チャンネルの wave の並び順をフォーマットする。
  static toBuffer(wave, channels) {
    wave.align()
    var float = new Float32Array(wave.left.length * channels)
    for (var i = 0, ic = 0; i < wave.left.length; ++i, ic += channels) {
      for (var j = 0; j < channels; ++j) {
        float[ic + j] = wave.data[j][i]
      }
    }
    var buffer = new Uint8Array(float.buffer)
    return buffer
  }

  // ヘッダで利用する format を生成。
  // sampleSize は 1 サンプルのビット数。
  static fileFormat(sampleRate, sampleSize, channels) {
    return {
      sampleRate,
      sampleSize,
      channels,
      bytesPerFrame: channels * sampleSize / 8
    }
  }
}
