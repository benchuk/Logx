<template>
  <div class="log-timeline-container" ref="container">
    <canvas ref="canvas" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseleave="hoverPos = null"></canvas>
    <div v-if="hoverPos" class="timeline-tooltip" :style="{ left: hoverPos.x + 'px' }">
      {{ hoverPos.text }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'LogTimeline',
  props: {
    lines: {
      type: Array,
      default: () => []
    },
    highlights: {
      type: Array,
      default: () => []
    },
    useColors: {
      type: Boolean,
      default: true
    },
    scrollPosition: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      hoverPos: null,
      ctx: null,
      dpr: window.devicePixelRatio || 1,
      timestampIndices: [], // Stores { time, index }
      isDragging: false,
      resizeObserver: null
    }
  },
  watch: {
    lines: {
      handler() {
        this.processLines()
        this.draw()
      },
      deep: false
    },
    highlights: {
      handler() {
        this.draw()
      },
      deep: true
    },
    useColors: {
      handler() {
        this.draw()
      }
    },
    scrollPosition: {
      handler() {
        this.draw()
      },
      deep: true
    }
  },
  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d')
    
    // Use ResizeObserver to detect container size changes (e.g. sidebar toggle)
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize()
      })
      this.resizeObserver.observe(this.$refs.container)
    }

    window.addEventListener('resize', this.onResize)
    this.onResize()
    this.processLines()
    this.draw()
  },
  beforeDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    onResize() {
      const container = this.$refs.container
      if (!container) return
      const canvas = this.$refs.canvas
      const rect = container.getBoundingClientRect()
      
      canvas.width = rect.width * this.dpr
      canvas.height = 40 * this.dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `40px`
      this.ctx.scale(this.dpr, this.dpr)
      this.draw()
    },
    processLines() {
      // Basic timestamp extraction
      // Look for YYYY-MM-DD HH:mm:ss or HH:mm:ss
      const tsRegex = /(\d{4}-\d{2}-\d{2}\s)?\d{2}:\d{2}:\d{2}(?:\.\d+)?/
      
      this.timestampIndices = []
      if (!this.lines.length) return

      // Sample lines to find start/end times if possible
      // For simplicity in a global timeline that "fills up", 
      // we'll just treat the array index as the primary time axis if timestamps are missing or inconsistent.
      // But if we have timestamps, we can map them.
      
      this.lines.forEach((line, index) => {
        const match = line.match(tsRegex)
        if (match) {
          // In a real app we'd convert to Date, but for a relative timeline,
          // index is often good enough for "location in file"
        }
      })
    },
    draw() {
      if (!this.ctx || !this.$refs.canvas) return
      const width = this.$refs.canvas.width / this.dpr
      const height = this.$refs.canvas.height / this.dpr
      const count = this.lines.length
      
      this.ctx.clearRect(0, 0, width, height)
      
      // Background track
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      this.ctx.fillRect(0, 5, width, height - 10)
      
      if (count === 0) return

      // Draw density (very tiny vertical bars)
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      // We limit drawing iterations for performance if lines > width
      const step = Math.max(1, Math.floor(count / width))
      for (let i = 0; i < count; i += step) {
        const x = (i / count) * width
        this.ctx.fillRect(x, 15, 1, height - 30)
      }

      // Draw Highlights
      if (this.useColors) {
        this.highlights.forEach(h => {
        if (!h.value || h.value.trim().length === 0) return
        
        const term = h.value.toLowerCase()
        this.ctx.fillStyle = h.color || '#fff'
        this.ctx.shadowBlur = 4
        this.ctx.shadowColor = h.color || '#fff'
        
        // This can be slow for millions of lines, but for standard logs it's okay.
        // Optimization: only check a subset or use a pre-indexed map if needed.
        for (let i = 0; i < count; i++) {
          if (this.lines[i].toLowerCase().includes(term)) {
            const x = (i / count) * width
            this.ctx.fillRect(x, 10, 1.5, height - 20)
            // If many lines match, we might skip some per pixel to avoid overdraw
          }
        }
      })
    }
    
    // Draw Scroll Marker
    if (this.scrollPosition) {
      const scroll = this.scrollPosition
      const x1 = (scroll.startRowId / this.lines.length) * width
      const x2 = (scroll.endRowId / this.lines.length) * width
      const w = Math.max(2, x2 - x1)
      
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)' // Cyan transparent
      this.ctx.shadowBlur = 0
      this.ctx.fillRect(x1, 0, w, height)
      
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.8)' // Cyan solid border
      this.ctx.fillRect(x1, 0, 2, height) // Left edge
      this.ctx.fillRect(x1 + w, 0, 2, height) // Right edge
    }
  },
    onMouseMove(e) {
      if (!this.lines.length || !this.$refs.canvas) return
      const rect = this.$refs.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = Math.max(0, Math.min(1, x / rect.width))
      const index = Math.floor(percent * this.lines.length)
      
      if (index >= 0 && index < this.lines.length) {
        this.hoverPos = {
          x: x,
          index: index,
          text: `Line ${index + 1}`
        }
      }
    },
    onMouseDown(e) {
      e.preventDefault() // Prevent text selection
      this.isDragging = true
      this.handleSeek(e)
      
      this._onMouseMove = this.onWindowMouseMove.bind(this)
      this._onMouseUp = this.onWindowMouseUp.bind(this)
      
      window.addEventListener('mousemove', this._onMouseMove)
      window.addEventListener('mouseup', this._onMouseUp)
    },
    onWindowMouseMove(e) {
      if (this.isDragging) {
        this.handleSeek(e)
      }
    },
    onWindowMouseUp(e) {
      this.isDragging = false
      window.removeEventListener('mousemove', this._onMouseMove)
      window.removeEventListener('mouseup', this._onMouseUp)
    },
    handleSeek(e) {
      if (!this.lines.length || !this.$refs.canvas) return
      const rect = this.$refs.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = Math.max(0, Math.min(1, x / rect.width))
      const index = Math.floor(percent * this.lines.length)
      this.$emit('seek', index)
    }
  }
}
</script>

<style scoped>
.log-timeline-container {
  width: 100%;
  height: 40px;
  position: relative;
  margin: 8px 0;
  cursor: crosshair;
  user-select: none;
  box-sizing: border-box;
}

canvas {
  display: block;
}

.timeline-tooltip {
  position: absolute;
  bottom: 100%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 100;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
