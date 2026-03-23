<style lang="less">
@import url('../assets/style/variable.less');

.component-wallpaper-cropper {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.78);
  padding: 24px;

  * {
    user-select: none;
  }

  .cropper-dialog {
    width: 100%;
    max-width: 960px;
    max-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  }

  .cropper-head {
    padding: 18px 24px 12px;
    border-bottom: solid 1px rgba(0, 0, 0, 0.08);

    h3 {
      margin: 0;
      font-size: 22px;
      color: @c-black;
    }

    p {
      margin-top: 8px;
      color: #666;
      font-size: 13px;
      line-height: 1.6;
      user-select: text;
    }
  }

  .cropper-stage-wrap {
    padding: 20px 24px 16px;
  }

  .cropper-stage {
    width: 100%;
    height: 62vh;
    max-height: 520px;
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    background:
      linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%) 0 0 / 24px 24px,
      linear-gradient(-45deg, rgba(255,255,255,0.08) 25%, transparent 25%) 0 0 / 24px 24px,
      linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.08) 75%) 0 0 / 24px 24px,
      linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.08) 75%) 0 0 / 24px 24px,
      #1e242d;
    cursor: grab;
    touch-action: none;
  }

  .cropper-stage.dragging {
    cursor: grabbing;
  }

  .cropper-image {
    position: absolute;
    top: 0;
    left: 0;
    max-width: none;
    max-height: none;
    will-change: transform;
  }

  .cropper-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .cropper-mask {
    position: absolute;
    background: rgba(0, 0, 0, 0.48);
  }

  .cropper-frame {
    position: absolute;
    border: solid 2px rgba(255, 255, 255, 0.98);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.38);
    border-radius: 10px;
  }

  .cropper-frame::before,
  .cropper-frame::after {
    content: '';
    position: absolute;
    inset: 12px;
    border: solid 1px rgba(255, 255, 255, 0.25);
  }

  .cropper-footer {
    padding: 0 24px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .zoom-control {
    flex: 1;
  }

  .zoom-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }

  .zoom-range {
    width: 100%;
  }

  .action-row {
    display: flex;
    gap: 10px;
  }

  .action-btn {
    min-width: 108px;
    height: 40px;
    border: none;
    border-radius: 999px;
    padding: 0 18px;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
  }

  .action-btn:hover {
    transform: translateY(-1px);
  }

  .action-btn.secondary {
    background: rgba(31, 111, 181, 0.14);
    color: @c-blue-d;
  }

  .action-btn.primary {
    background: @c-blue;
    color: #fff;
  }

  @media (max-width: 720px) {
    padding: 12px;

    .cropper-dialog {
      max-height: calc(100vh - 24px);
    }

    .cropper-stage-wrap {
      padding: 16px;
    }

    .cropper-head,
    .cropper-footer {
      padding-left: 16px;
      padding-right: 16px;
    }

    .cropper-footer {
      flex-direction: column;
      align-items: stretch;
    }

    .action-row {
      width: 100%;
    }

    .action-btn {
      flex: 1;
    }
  }
}
</style>

<template>
  <div
    v-show="visible"
    class="component-wallpaper-cropper"
    @mouseup="stopDrag"
    @mouseleave="stopDrag"
    @touchend.prevent="stopDrag"
    @touchcancel.prevent="stopDrag"
  >
    <div class="cropper-dialog" @click.stop>
      <div class="cropper-head">
        <h3>调整壁纸</h3>
        <p>拖动图片调整取景，缩放到适合当前网页比例，然后再应用为背景。</p>
      </div>

      <div class="cropper-stage-wrap">
        <div
          ref="stage"
          class="cropper-stage"
          :class="{ dragging: isDragging }"
          @mousedown.prevent="startDrag"
          @mousemove.prevent="handleDrag"
          @touchstart.prevent="startDrag"
          @touchmove.prevent="handleDrag"
        >
          <img
            v-if="imageSrc"
            ref="image"
            class="cropper-image"
            :src="imageSrc"
            alt="Wallpaper crop preview"
            @load="onImageLoad"
            :style="imageStyle"
          />

          <div v-if="frameRect.width && frameRect.height" class="cropper-overlay">
            <div
              class="cropper-mask"
              :style="{ left: '0px', top: '0px', width: stageRect.width + 'px', height: frameRect.top + 'px' }"
            ></div>
            <div
              class="cropper-mask"
              :style="{ left: '0px', top: frameRect.top + 'px', width: frameRect.left + 'px', height: frameRect.height + 'px' }"
            ></div>
            <div
              class="cropper-mask"
              :style="{ left: frameRect.left + frameRect.width + 'px', top: frameRect.top + 'px', width: stageRect.width - frameRect.left - frameRect.width + 'px', height: frameRect.height + 'px' }"
            ></div>
            <div
              class="cropper-mask"
              :style="{ left: '0px', top: frameRect.top + frameRect.height + 'px', width: stageRect.width + 'px', height: stageRect.height - frameRect.top - frameRect.height + 'px' }"
            ></div>
            <div class="cropper-frame" :style="frameStyle"></div>
          </div>
        </div>
      </div>

      <div class="cropper-footer">
        <div class="zoom-control">
          <div class="zoom-label">
            <span>缩放</span>
            <span>{{ Math.round(zoom * 100) }}%</span>
          </div>
          <input
            class="zoom-range"
            type="range"
            min="1"
            max="3"
            step="0.01"
            v-model.number="zoom"
            @input="updateZoom"
          />
        </div>

        <div class="action-row">
          <button class="action-btn secondary" type="button" @click="$emit('cancel')">取消</button>
          <button class="action-btn primary" type="button" @click="applyCrop">应用壁纸</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WallpaperCropper',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    imageSrc: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      imageNatural: {
        width: 0,
        height: 0
      },
      stageRect: {
        width: 0,
        height: 0
      },
      frameRect: {
        left: 0,
        top: 0,
        width: 0,
        height: 0
      },
      imageRect: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      baseScale: 1,
      zoom: 1,
      isDragging: false,
      dragStart: {
        x: 0,
        y: 0,
        imageX: 0,
        imageY: 0
      }
    }
  },
  computed: {
    imageStyle() {
      return {
        width: `${this.imageRect.width}px`,
        height: `${this.imageRect.height}px`,
        transform: `translate(${this.imageRect.x}px, ${this.imageRect.y}px)`
      }
    },
    frameStyle() {
      return {
        left: `${this.frameRect.left}px`,
        top: `${this.frameRect.top}px`,
        width: `${this.frameRect.width}px`,
        height: `${this.frameRect.height}px`
      }
    }
  },
  watch: {
    visible(value) {
      if (value) {
        this.$nextTick(() => {
          this.computeStage()
          if (this.imageSrc) {
            this.resetCrop()
          }
        })
      } else {
        this.isDragging = false
      }
    },
    imageSrc() {
      this.zoom = 1
      this.$nextTick(() => {
        this.computeStage()
      })
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      if (!this.visible) return
      this.computeStage()
      this.resetCrop()
    },
    computeStage() {
      const stage = this.$refs.stage
      if (!stage) return

      const rect = stage.getBoundingClientRect()
      this.stageRect = {
        width: rect.width,
        height: rect.height
      }

      const aspect = window.innerWidth && window.innerHeight
        ? window.innerWidth / window.innerHeight
        : 16 / 9

      const padding = 36
      const maxWidth = Math.max(rect.width - padding * 2, 120)
      const maxHeight = Math.max(rect.height - padding * 2, 120)

      let frameWidth = maxWidth
      let frameHeight = frameWidth / aspect

      if (frameHeight > maxHeight) {
        frameHeight = maxHeight
        frameWidth = frameHeight * aspect
      }

      this.frameRect = {
        width: frameWidth,
        height: frameHeight,
        left: (rect.width - frameWidth) / 2,
        top: (rect.height - frameHeight) / 2
      }
    },
    onImageLoad(event) {
      const image = event.target
      this.imageNatural = {
        width: image.naturalWidth,
        height: image.naturalHeight
      }
      this.computeStage()
      this.resetCrop()
    },
    resetCrop() {
      if (!this.imageNatural.width || !this.frameRect.width || !this.frameRect.height) return

      this.baseScale = Math.max(
        this.frameRect.width / this.imageNatural.width,
        this.frameRect.height / this.imageNatural.height
      )
      this.zoom = 1

      const width = this.imageNatural.width * this.baseScale
      const height = this.imageNatural.height * this.baseScale

      this.imageRect = {
        width,
        height,
        x: this.frameRect.left + (this.frameRect.width - width) / 2,
        y: this.frameRect.top + (this.frameRect.height - height) / 2
      }

      this.clampImageRect()
    },
    updateZoom() {
      if (!this.imageNatural.width) return

      const prevCenter = {
        x: this.frameRect.left + this.frameRect.width / 2,
        y: this.frameRect.top + this.frameRect.height / 2
      }
      const relativeCenter = {
        x: (prevCenter.x - this.imageRect.x) / this.imageRect.width,
        y: (prevCenter.y - this.imageRect.y) / this.imageRect.height
      }

      const width = this.imageNatural.width * this.baseScale * this.zoom
      const height = this.imageNatural.height * this.baseScale * this.zoom

      this.imageRect.width = width
      this.imageRect.height = height
      this.imageRect.x = prevCenter.x - width * relativeCenter.x
      this.imageRect.y = prevCenter.y - height * relativeCenter.y

      this.clampImageRect()
    },
    clampImageRect() {
      const minX = this.frameRect.left + this.frameRect.width - this.imageRect.width
      const maxX = this.frameRect.left
      const minY = this.frameRect.top + this.frameRect.height - this.imageRect.height
      const maxY = this.frameRect.top

      this.imageRect.x = Math.min(maxX, Math.max(minX, this.imageRect.x))
      this.imageRect.y = Math.min(maxY, Math.max(minY, this.imageRect.y))
    },
    getPointer(event) {
      if (event.touches && event.touches[0]) {
        return {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        }
      }

      return {
        x: event.clientX,
        y: event.clientY
      }
    },
    startDrag(event) {
      if (!this.imageNatural.width) return
      const pointer = this.getPointer(event)
      this.isDragging = true
      this.dragStart = {
        x: pointer.x,
        y: pointer.y,
        imageX: this.imageRect.x,
        imageY: this.imageRect.y
      }
    },
    handleDrag(event) {
      if (!this.isDragging) return
      const pointer = this.getPointer(event)
      this.imageRect.x = this.dragStart.imageX + (pointer.x - this.dragStart.x)
      this.imageRect.y = this.dragStart.imageY + (pointer.y - this.dragStart.y)
      this.clampImageRect()
    },
    stopDrag() {
      this.isDragging = false
    },
    applyCrop() {
      if (!this.imageNatural.width) return

      const sourceX = Math.max(0, (this.frameRect.left - this.imageRect.x) / this.imageRect.width * this.imageNatural.width)
      const sourceY = Math.max(0, (this.frameRect.top - this.imageRect.y) / this.imageRect.height * this.imageNatural.height)
      const sourceWidth = Math.min(
        this.imageNatural.width,
        this.frameRect.width / this.imageRect.width * this.imageNatural.width
      )
      const sourceHeight = Math.min(
        this.imageNatural.height,
        this.frameRect.height / this.imageRect.height * this.imageNatural.height
      )

      const aspect = this.frameRect.width / this.frameRect.height
      let outputWidth = Math.round(sourceWidth)
      let outputHeight = Math.round(sourceHeight)

      if (aspect >= 1 && outputWidth > 1920) {
        outputWidth = 1920
        outputHeight = Math.round(outputWidth / aspect)
      } else if (aspect < 1 && outputHeight > 1920) {
        outputHeight = 1920
        outputWidth = Math.round(outputHeight * aspect)
      }

      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight

      const image = this.$refs.image
      const context = canvas.getContext('2d')
      if (!context || !image) return

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      )

      this.$emit('apply', canvas.toDataURL('image/jpeg', 0.92))
    }
  }
}
</script>
